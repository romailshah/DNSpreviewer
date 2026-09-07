import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import Database from "better-sqlite3";
import { db } from "./db";
import {
  BACKUP_ENABLED,
  BACKUP_ENCRYPTED,
  BACKUP_ENCRYPTION_KEY,
  BACKUP_GITHUB_BRANCH,
  BACKUP_GITHUB_ENABLED,
  BACKUP_GITHUB_KEEP,
  BACKUP_GITHUB_PREFIX,
  BACKUP_GITHUB_REPO,
  BACKUP_GITHUB_TOKEN,
  BACKUP_S3_ACCESS_KEY_ID,
  BACKUP_S3_BUCKET,
  BACKUP_S3_ENABLED,
  BACKUP_S3_ENDPOINT,
  BACKUP_S3_PREFIX,
  BACKUP_S3_REGION,
  BACKUP_S3_SECRET_ACCESS_KEY,
} from "./env";

export interface BackupResult {
  key: string;
  rawBytes: number;
  uploadedBytes: number;
  encrypted: boolean;
  integrity: string;
  destinations: string[];
  pruned: number;
  durationMs: number;
}

/** Magic header so a stray file on disk is identifiable, and so the decrypt
 *  helper can refuse anything that is not one of ours. */
const MAGIC = Buffer.from("DNSPBK", "ascii");
const FORMAT_VERSION = 1;

/**
 * Snapshot the live SQLite database and push it off-host.
 *
 * Everything the service owns lives in one SQLite file on one Fly volume:
 * user accounts, no-expiry preview links, auth sessions, the activity log.
 * A volume is not a backup.
 *
 * The dump carries user emails, bcrypt password hashes, auth session tokens
 * and creator IP addresses, which is why encryption happens here, before the
 * bytes leave the machine, rather than being left to whatever the destination
 * offers.
 */
export async function runBackup(): Promise<BackupResult> {
  if (!BACKUP_ENABLED) {
    throw new Error(
      "No backup destination is configured. Set BACKUP_GITHUB_TOKEN and BACKUP_GITHUB_REPO, or the BACKUP_S3_* variables.",
    );
  }

  const started = Date.now();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dnsp-backup-"));
  const tmpFile = path.join(tmpDir, "snapshot.db");

  try {
    // sqlite's online backup API: a consistent copy while the app keeps serving.
    await db().backup(tmpFile);

    // Verify the copy before trusting it. A backup that silently captured a
    // corrupt page is worse than no backup, because it stops you looking.
    const verify = new Database(tmpFile, { readonly: true });
    const integrity = verify.pragma("quick_check", { simple: true }) as unknown as string;
    verify.close();
    if (integrity !== "ok") throw new Error(`Backup failed integrity check: ${integrity}`);

    const raw = fs.readFileSync(tmpFile);
    const gz = zlib.gzipSync(raw, { level: 9 });
    const payload = BACKUP_ENCRYPTED ? encrypt(gz) : gz;
    const filename = `dnspreviewer-${stamp}.db.gz${BACKUP_ENCRYPTED ? ".enc" : ""}`;

    const d = new Date();
    const datePath = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

    const destinations: string[] = [];
    let pruned = 0;
    let key = "";

    if (BACKUP_GITHUB_ENABLED) {
      key = joinPath(BACKUP_GITHUB_PREFIX, datePath, filename);
      await putGithubFile(key, payload);
      pruned = await pruneGithubBackups();
      destinations.push(`github:${BACKUP_GITHUB_REPO}`);
    }

    if (BACKUP_S3_ENABLED) {
      const s3Key = joinPath(BACKUP_S3_PREFIX, datePath, filename);
      await putS3Object(s3Key, payload);
      if (!key) key = s3Key;
      destinations.push(`s3:${BACKUP_S3_BUCKET}`);
    }

    return {
      key,
      rawBytes: raw.byteLength,
      uploadedBytes: payload.byteLength,
      encrypted: BACKUP_ENCRYPTED,
      integrity,
      destinations,
      pruned,
      durationMs: Date.now() - started,
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function joinPath(...parts: string[]): string {
  return parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

// ─── Encryption ──────────────────────────────────────────────────────────────
// AES-256-GCM. Container layout:
//   "DNSPBK" (6) | version (1) | iv (12) | authTag (16) | ciphertext
// The key is a Fly secret and is never written to disk. Lose it and the
// backups are unrecoverable, which is the tradeoff encryption always carries.

export function encrypt(plaintext: Buffer): Buffer {
  const key = readKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, Buffer.from([FORMAT_VERSION]), iv, tag, ciphertext]);
}

export function decrypt(container: Buffer, keyHex: string): Buffer {
  if (container.length < MAGIC.length + 1 + 12 + 16) {
    throw new Error("File is too small to be a DNS Previewer backup");
  }
  if (!container.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("Not a DNS Previewer backup (bad magic header)");
  }
  const version = container[MAGIC.length];
  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported backup format version ${version}`);
  }
  const key = parseKey(keyHex);
  const ivStart = MAGIC.length + 1;
  const iv = container.subarray(ivStart, ivStart + 12);
  const tag = container.subarray(ivStart + 12, ivStart + 28);
  const ciphertext = container.subarray(ivStart + 28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  // Throws if the key is wrong or the file was tampered with, which is the
  // behaviour we want. A silently wrong plaintext would be much worse.
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function readKey(): Buffer {
  return parseKey(BACKUP_ENCRYPTION_KEY);
}

function parseKey(hex: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "BACKUP_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(hex, "hex");
}

// ─── Destination A: private GitHub repository ────────────────────────────────

const GITHUB_API = "https://api.github.com";

function githubHeaders(): Record<string, string> {
  return {
    authorization: `Bearer ${BACKUP_GITHUB_TOKEN}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "dnspreviewer-backup",
  };
}

async function putGithubFile(filePath: string, body: Buffer): Promise<void> {
  const res = await fetch(
    `${GITHUB_API}/repos/${BACKUP_GITHUB_REPO}/contents/${encodePath(filePath)}`,
    {
      method: "PUT",
      headers: { ...githubHeaders(), "content-type": "application/json" },
      body: JSON.stringify({
        message: `Backup ${new Date().toISOString()}`,
        content: body.toString("base64"),
        branch: BACKUP_GITHUB_BRANCH,
      }),
      signal: AbortSignal.timeout(120_000),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub upload failed: ${res.status} ${res.statusText} ${text.slice(0, 400)}`);
  }
}

interface GithubEntry {
  name: string;
  path: string;
  sha: string;
  type: string;
}

/**
 * Retention. Object stores do this with a lifecycle rule; GitHub has no such
 * thing, so the job prunes its own history. Files are timestamped in their
 * name, so a lexicographic sort is chronological.
 */
async function pruneGithubBackups(): Promise<number> {
  if (!Number.isFinite(BACKUP_GITHUB_KEEP) || BACKUP_GITHUB_KEEP <= 0) return 0;

  const files: GithubEntry[] = [];
  const months = await listGithubDir(BACKUP_GITHUB_PREFIX);
  for (const year of months.filter((e) => e.type === "dir")) {
    for (const month of (await listGithubDir(year.path)).filter((e) => e.type === "dir")) {
      files.push(...(await listGithubDir(month.path)).filter((e) => e.type === "file"));
    }
  }

  files.sort((a, b) => a.name.localeCompare(b.name));
  const excess = files.length - BACKUP_GITHUB_KEEP;
  if (excess <= 0) return 0;

  let removed = 0;
  for (const f of files.slice(0, excess)) {
    const res = await fetch(
      `${GITHUB_API}/repos/${BACKUP_GITHUB_REPO}/contents/${encodePath(f.path)}`,
      {
        method: "DELETE",
        headers: { ...githubHeaders(), "content-type": "application/json" },
        body: JSON.stringify({
          message: `Prune old backup ${f.name}`,
          sha: f.sha,
          branch: BACKUP_GITHUB_BRANCH,
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (res.ok) removed++;
    else console.error(`[backup] prune failed for ${f.path}: ${res.status}`);
  }
  return removed;
}

async function listGithubDir(dirPath: string): Promise<GithubEntry[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${BACKUP_GITHUB_REPO}/contents/${encodePath(dirPath)}?ref=${encodeURIComponent(BACKUP_GITHUB_BRANCH)}`,
    { headers: githubHeaders(), signal: AbortSignal.timeout(30_000) },
  );
  // 404 simply means nothing has been written under this path yet.
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub listing failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return Array.isArray(data) ? (data as GithubEntry[]) : [];
}

function encodePath(p: string): string {
  return p
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

// ─── Destination B: minimal SigV4 S3 PUT ─────────────────────────────────────
// Works against any S3-compatible bucket (Cloudflare R2, Backblaze B2, AWS S3,
// Wasabi). Hand-rolled rather than pulling in @aws-sdk/client-s3, which would
// add tens of megabytes to a container whose whole job is proxying HTTP.

async function putS3Object(key: string, body: Buffer): Promise<void> {
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
    `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzDate}\n`;
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
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256hex(canonicalRequest)].join("\n");

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
      "content-type": "application/octet-stream",
      "content-length": String(body.byteLength),
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`S3 upload failed: ${res.status} ${res.statusText} ${text.slice(0, 400)}`);
  }
}

function hmac(key: crypto.BinaryLike | crypto.KeyObject, msg: string): Buffer {
  return crypto
    .createHmac("sha256", key as crypto.BinaryLike)
    .update(msg, "utf8")
    .digest();
}

function sha256hex(data: crypto.BinaryLike): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}
