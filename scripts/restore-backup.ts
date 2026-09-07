/**
 * Turn a backup file back into a usable SQLite database.
 *
 *   BACKUP_ENCRYPTION_KEY=<64 hex chars> npx tsx scripts/restore-backup.ts <file> [output.db]
 *
 * Accepts either an encrypted backup (.db.gz.enc) or a plain one (.db.gz).
 * Decrypts if needed, decompresses, then runs an integrity check on the result
 * so you find out here rather than after you have overwritten production.
 *
 * Test this before you need it. An untested restore path is not a backup.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import Database from "better-sqlite3";
import { decrypt } from "../lib/backup";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npx tsx scripts/restore-backup.ts <backup file> [output.db]");
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.error(`No such file: ${input}`);
  process.exit(1);
}

const output = process.argv[3] || input.replace(/\.db\.gz(\.enc)?$/, "") + ".restored.db";

let blob = fs.readFileSync(input);
console.log(`Read ${input} (${(blob.byteLength / 1024).toFixed(1)} KB)`);

// Encrypted backups start with our magic header. Detect rather than rely on
// the file extension, because people rename files.
const looksEncrypted = blob.subarray(0, 6).toString("ascii") === "DNSPBK";

if (looksEncrypted) {
  const key = process.env.BACKUP_ENCRYPTION_KEY || "";
  if (!key) {
    console.error(
      "This backup is encrypted. Set BACKUP_ENCRYPTION_KEY to the 64 hex character key it was encrypted with.",
    );
    process.exit(1);
  }
  try {
    blob = decrypt(blob, key);
    console.log("Decrypted.");
  } catch (e) {
    console.error(`Decryption failed: ${(e as Error).message}`);
    console.error("Either the key is wrong or the file has been altered.");
    process.exit(1);
  }
} else {
  console.log("File is not encrypted, skipping decryption.");
}

const plain = zlib.gunzipSync(blob);
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(output, plain);
console.log(`Wrote ${output} (${(plain.byteLength / 1024).toFixed(1)} KB)`);

const check = new Database(output, { readonly: true });
const integrity = check.pragma("quick_check", { simple: true }) as unknown as string;
const counts = check
  .prepare(
    "SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM preview_sessions) AS previews",
  )
  .get() as { users: number; previews: number };
check.close();

if (integrity !== "ok") {
  console.error(`Integrity check FAILED: ${integrity}`);
  process.exit(1);
}
console.log(`Integrity check: ok`);
console.log(`Contains ${counts.users} users and ${counts.previews} preview sessions.`);
console.log("");
console.log("To put this live, see the Restore section of OPERATIONS.md.");
console.log("Remember to delete /data/dnspreviewer.db-wal and -shm when you swap it in.");
