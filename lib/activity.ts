import { db } from "./db";

export type ActivityKind =
  | "user.signup"
  | "user.login"
  | "user.logout"
  | "user.disabled"
  | "user.enabled"
  | "user.role_changed"
  | "user.deleted"
  | "preview.created"
  | "preview.disabled"
  | "preview.enabled"
  | "preview.deleted"
  | "admin.action";

export interface Activity {
  id: number;
  kind: ActivityKind;
  userId: string | null;
  ip: string | null;
  details: Record<string, unknown> | null;
  createdAt: number;
}

interface Row {
  id: number;
  kind: string;
  user_id: string | null;
  ip: string | null;
  details: string | null;
  created_at: number;
}

function fromRow(r: Row): Activity {
  return {
    id: r.id,
    kind: r.kind as ActivityKind,
    userId: r.user_id,
    ip: r.ip,
    details: r.details ? (JSON.parse(r.details) as Record<string, unknown>) : null,
    createdAt: r.created_at,
  };
}

export function logActivity(
  kind: ActivityKind,
  opts: { userId?: string | null; ip?: string | null; details?: Record<string, unknown> } = {},
): void {
  try {
    db()
      .prepare(
        "INSERT INTO activity_log (kind, user_id, ip, details, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        kind,
        opts.userId ?? null,
        opts.ip ?? null,
        opts.details ? JSON.stringify(opts.details) : null,
        Date.now(),
      );
  } catch {
    // Never let logging fail a user-facing operation.
  }
}

export function recentActivity(limit = 50, offset = 0): Activity[] {
  const rows = db()
    .prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as Row[];
  return rows.map(fromRow);
}

export function activityCount(): number {
  const r = db().prepare("SELECT COUNT(*) AS n FROM activity_log").get() as { n: number };
  return r.n;
}

/**
 * Drop log rows older than `daysToKeep`. Call from a nightly cron or on-demand.
 */
export function pruneActivity(daysToKeep = 30): number {
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  const info = db().prepare("DELETE FROM activity_log WHERE created_at < ?").run(cutoff);
  return info.changes;
}
