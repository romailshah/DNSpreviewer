/**
 * Promote an existing user to admin role, or list admins.
 *
 *   npx tsx scripts/make-admin.ts user@example.com
 *   npx tsx scripts/make-admin.ts --list
 *   npx tsx scripts/make-admin.ts --demote user@example.com
 */
import { db } from "../lib/db";

function usage(): never {
  console.error(
    [
      "Usage:",
      "  npx tsx scripts/make-admin.ts <email>              # promote to admin",
      "  npx tsx scripts/make-admin.ts --demote <email>     # demote to user",
      "  npx tsx scripts/make-admin.ts --list               # list all admins",
    ].join("\n"),
  );
  process.exit(1);
}

function list() {
  const rows = db()
    .prepare("SELECT email, created_at FROM users WHERE role = 'admin' ORDER BY created_at ASC")
    .all() as Array<{ email: string; created_at: number }>;
  if (rows.length === 0) {
    console.log("No admins yet.");
    return;
  }
  console.log(`Admins (${rows.length}):`);
  for (const r of rows) {
    console.log(`  ${r.email}  (created ${new Date(r.created_at).toISOString()})`);
  }
}

function setRole(email: string, role: "admin" | "user") {
  const e = email.trim().toLowerCase();
  const u = db().prepare("SELECT id, role FROM users WHERE email = ?").get(e) as
    | { id: string; role: string }
    | undefined;
  if (!u) {
    console.error(`No user with email ${e}`);
    process.exit(2);
  }
  if (u.role === role) {
    console.log(`${e} is already ${role}.`);
    return;
  }
  db().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, u.id);
  console.log(`${role === "admin" ? "Promoted" : "Demoted"} ${e} → ${role}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  if (args[0] === "--list") return list();
  if (args[0] === "--demote") {
    if (!args[1]) usage();
    return setRole(args[1], "user");
  }
  if (args[0].startsWith("-")) usage();
  return setRole(args[0], "admin");
}

main();
