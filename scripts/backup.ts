/**
 * Run an off-host backup by hand.
 *
 *   npx tsx scripts/backup.ts
 *
 * Reads the same BACKUP_S3_* env vars as the scheduled /api/cron/backup
 * endpoint. Useful for verifying credentials before trusting the schedule,
 * and for taking an ad-hoc snapshot before a risky migration.
 */
import { runBackup } from "../lib/backup";

runBackup()
  .then((r) => {
    const mb = (n: number) => (n / 1_048_576).toFixed(2);
    console.log(`Backed up to ${r.key}`);
    console.log(`  database: ${mb(r.rawBytes)} MB → ${mb(r.uploadedBytes)} MB gzipped`);
    console.log(`  integrity: ${r.integrity}`);
    console.log(`  took: ${r.durationMs} ms`);
  })
  .catch((e: Error) => {
    console.error(`Backup failed: ${e.message}`);
    process.exit(1);
  });
