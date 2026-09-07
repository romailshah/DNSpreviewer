import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import Database from "better-sqlite3";
import { db } from "./db";
import {
  BACKUP_ENABLED,
  BACKUP_S3_ACCESS_KEY_ID,
  BACKUP_S3_BUCKET,
  BACKUP_S3_ENDPOINT,
  BACKUP_S3_PREFIX,
  BACKUP_S3_REGION,
  BACKUP_S3_SECRET_ACCESS_KEY,
} from "./env";

export interface BackupResult {
  key: string;
  rawBytes: number;
  uploadedBytes: number;
  integrity: string;
  durationMs: number;
}

/**
 * Snapshot the live SQLite database and push it off-host.
 *
 * Everything the service owns lives in one SQLite file on one Fly volume:
 * user accounts, no-expiry preview links, auth sessions, the activity log.
 * A volume is not a backup — this is the only thing standing between a bad
 * day and total data loss, so it runs on a schedule and verifies what it
 * uploads.
 */
export async function runBackup(): Promise<BackupResult> {
  if (!BACKUP_ENABLED) {
    throw new Error(
      "Backups are not configured. Set BACKUP_S3_ENDPOINT, BACKUP_S3_BUCKET, BACKUP_S3_ACCESS_KEY_ID and BACKUP_S3_SECRET_ACCESS_KEY.",
    );
  }

  const started = Date.now();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").replace(/Z$/, "Z");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dnsp-backup-"));
  const tmpFile = path.join(tmpDir, "snapshot.db");

  try {
    // sqlite's online backup API: consistent copy while the app keeps serving.
    await db().backup(tmpFile);

    // Verify the copy before trusting it. A backup that silently captured a
    // corrupt page is worse than no backup, because it stops you looking.
    const verify = new Database(tmpFile, { readonly: true });
    const row = verify.pragma("quick_check", { simple: true }) as unknown as string;
    verify.close();
    if (row !== "ok") throw new Error(`Backup failed integrity check: ${row}`);

    const raw = fs.readFileSync(tmpFile);
    const gz = zlib.gzipSync(raw, { level: 9 });

    const d = new Date();
    const key = [
      BACKUP_S3_PREFIX.replace(/^\/+|\/+$/g, ""),
      String(d.getUTCFullYear()),
      String(d.getUTCMonth() + 1).padStart(2, "0"),
      `dnspreviewer-${stamp}.db.gz`,
    ]
      .filter(Boolean)
      .join("/");

    await putObject(key, gz);

    return {
      key,
      rawBytes: raw.byteLength,
      uploadedBytes: gz.byteLength,
      integrity: row,
      durationMs: Date.now() - started,
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ─── Minimal SigV4 S3 PUT ────────────────────────────────────────────────────
// Works against any S3-compatible bucket (Cloudflare R2, Backblaze B2, AWS S3,
// Wasabi). Hand-rolled rather than pulling in @aws-sdk/client-s3, which would
// add tens of megabytes to a container whose whole job is proxying HTTP.

async function putObject(key: string, body: Buffer): Promise<void> {
  const endpoint = BACKUP_S3_ENDPOINT.replace(/\/+$/, "");
  const url = new URL(`${endpoint}/${BACKUP_S3_BUCKET}/${key}`);
  const host = url.host;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256hex(body);

  const canonicalUri = url.pathname
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(seg) : seg))
    .join("/");

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${BACKUP_S3_REGION}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${BACKUP_S3_SECRET_ACCESS_KEY}`, dateStamp);
  const kRegion = hmac(kDate, BACKUP_S3_REGION);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmac(kSigning, stringToSign).toString("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${BACKUP_S3_ACCESS_KEY_ID}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      authorization,
      host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      "content-type": "application/gzip",
      "content-length": String(body.byteLength),
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text.slice(0, 500)}`);
  }
}

function hmac(key: crypto.BinaryLike | crypto.KeyObject, msg: string): Buffer {
  return crypto.createHmac("sha256", key as crypto.BinaryLike).update(msg, "utf8").digest();
}

function sha256hex(data: crypto.BinaryLike): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}
