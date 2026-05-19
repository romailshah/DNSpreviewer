/**
 * Trim the activity log. Defaults to keeping 30 days.
 *
 *   npx tsx scripts/prune-activity.ts         # keep 30 days (default)
 *   npx tsx scripts/prune-activity.ts 7       # keep 7 days
 *
 * Safe to run from cron nightly.
 */
import { pruneActivity } from "../lib/activity";

const days = Number(process.argv[2] || 30);
if (!Number.isFinite(days) || days <= 0) {
  console.error("Days must be a positive number.");
  process.exit(1);
}
const removed = pruneActivity(days);
console.log(`Pruned ${removed} activity log rows older than ${days} days.`);
