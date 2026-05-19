import { customAlphabet } from "nanoid";
import { SESSION_TTL_MS } from "./env";
import { db } from "./db";

export type Protocol = "https" | "http" | "both";
export type SiteType = "regular" | "wildcard" | "subdomain";

export interface PreviewSession {
  id: string;
  userId: string | null;
  label: string | null;
  domain: string;
  target: string;
  protocol: Protocol;
  port: number | null;
  siteType: SiteType;
  subdomain: string | null;
  passwordHash: string | null;
  createdAt: number;
  expiresAt: number | null; // null = no expiry
  disabled: boolean;
  creatorIp: string;
  hitCount: number;
}

interface Row {
  id: string;
  user_id: string | null;
  label: string | null;
  domain: string;
  target: string;
  protocol: string;
  port: number | null;
  site_type: string;
  subdomain: string | null;
  password_hash: string | null;
  created_at: number;
  expires_at: number | null;
  disabled: number;
  creator_ip: string;
  hit_count: number;
}

const newId = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 10);

function toSession(r: Row): PreviewSession {
  return {
    id: r.id,
    userId: r.user_id,
    label: r.label,
    domain: r.domain,
    target: r.target,
    protocol: r.protocol as Protocol,
    port: r.port,
    siteType: r.site_type as SiteType,
    subdomain: r.subdomain,
    passwordHash: r.password_hash,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    disabled: r.disabled === 1,
    creatorIp: r.creator_ip,
    hitCount: r.hit_count,
  };
}

export interface CreateSessionArgs {
  userId: string | null;
  label: string | null;
  domain: string;
  target: string;
  protocol: Protocol;
  port: number | null;
  siteType: SiteType;
  subdomain: string | null;
  passwordHash: string | null;
  creatorIp: string;
  noExpiry: boolean;
}

export function createSession(args: CreateSessionArgs): PreviewSession {
  const now = Date.now();
  const id = newId();
  const expiresAt = args.noExpiry ? null : now + SESSION_TTL_MS;
  db()
    .prepare(
      `INSERT INTO preview_sessions (id, user_id, label, domain, target, protocol, port,
        site_type, subdomain, password_hash, created_at, expires_at, disabled, creator_ip, hit_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0)`,
    )
    .run(
      id,
      args.userId,
      args.label,
      args.domain,
      args.target,
      args.protocol,
      args.port,
      args.siteType,
      args.subdomain,
      args.passwordHash,
      now,
      expiresAt,
      args.creatorIp,
    );
  return getSessionRaw(id)!;
}

export function getSession(id: string): PreviewSession | null {
  const s = getSessionRaw(id);
  if (!s) return null;
  if (s.disabled) return null;
  if (s.expiresAt != null && s.expiresAt < Date.now()) return null;
  return s;
}

export function getSessionRaw(id: string): PreviewSession | null {
  const row = db().prepare("SELECT * FROM preview_sessions WHERE id = ?").get(id) as Row | undefined;
  return row ? toSession(row) : null;
}

export function recordHit(id: string): void {
  db().prepare("UPDATE preview_sessions SET hit_count = hit_count + 1 WHERE id = ?").run(id);
}

export function deleteSession(id: string): boolean {
  const info = db().prepare("DELETE FROM preview_sessions WHERE id = ?").run(id);
  return info.changes > 0;
}

export function setSessionDisabled(id: string, disabled: boolean): void {
  db().prepare("UPDATE preview_sessions SET disabled = ? WHERE id = ?").run(disabled ? 1 : 0, id);
}

export function listSessionsByUser(userId: string): PreviewSession[] {
  const rows = db()
    .prepare("SELECT * FROM preview_sessions WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as Row[];
  return rows.map(toSession);
}

export function countRecentByIp(ip: string, sinceMs: number): number {
  const cutoff = Date.now() - sinceMs;
  const row = db()
    .prepare(
      "SELECT COUNT(*) AS n FROM preview_sessions WHERE creator_ip = ? AND created_at >= ?",
    )
    .get(ip, cutoff) as { n: number };
  return row.n;
}

export function sweepExpired(): void {
  db().prepare("DELETE FROM preview_sessions WHERE expires_at IS NOT NULL AND expires_at < ?").run(Date.now());
}

// === Admin-wide queries ===

export interface AdminPreviewRow extends PreviewSession {
  userEmail: string | null;
}

export function listAllSessionsAdmin(opts: {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "all" | "active" | "expired" | "disabled";
} = {}): AdminPreviewRow[] {
  const limit = opts.limit ?? 200;
  const offset = opts.offset ?? 0;
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (opts.search && opts.search.trim()) {
    where.push("(p.domain LIKE ? OR p.target LIKE ? OR p.label LIKE ? OR p.id LIKE ? OR u.email LIKE ?)");
    const like = `%${opts.search.trim()}%`;
    params.push(like, like, like, like, like);
  }
  const now = Date.now();
  if (opts.status === "active") {
    where.push("p.disabled = 0 AND (p.expires_at IS NULL OR p.expires_at > ?)");
    params.push(now);
  } else if (opts.status === "expired") {
    where.push("p.expires_at IS NOT NULL AND p.expires_at <= ?");
    params.push(now);
  } else if (opts.status === "disabled") {
    where.push("p.disabled = 1");
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db()
    .prepare(
      `SELECT p.*, u.email AS user_email
       FROM preview_sessions p
       LEFT JOIN users u ON u.id = p.user_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as Array<Row & { user_email: string | null }>;
  return rows.map((r) => ({ ...toSession(r), userEmail: r.user_email }));
}

export function countAllSessions(): {
  total: number;
  active: number;
  expired: number;
  disabled: number;
  anonymous: number;
  noExpiry: number;
  passwordProtected: number;
} {
  const d = db();
  const now = Date.now();
  const row = d
    .prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN disabled = 0 AND (expires_at IS NULL OR expires_at > ?) THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN expires_at IS NOT NULL AND expires_at <= ? THEN 1 ELSE 0 END) AS expired,
        SUM(CASE WHEN disabled = 1 THEN 1 ELSE 0 END) AS disabled,
        SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS anonymous,
        SUM(CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END) AS no_expiry,
        SUM(CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END) AS pw
      FROM preview_sessions`,
    )
    .get(now, now) as {
      total: number;
      active: number;
      expired: number;
      disabled: number;
      anonymous: number;
      no_expiry: number;
      pw: number;
    };
  return {
    total: row.total ?? 0,
    active: row.active ?? 0,
    expired: row.expired ?? 0,
    disabled: row.disabled ?? 0,
    anonymous: row.anonymous ?? 0,
    noExpiry: row.no_expiry ?? 0,
    passwordProtected: row.pw ?? 0,
  };
}

export function totalHits(): number {
  const r = db().prepare("SELECT SUM(hit_count) AS n FROM preview_sessions").get() as { n: number | null };
  return r.n ?? 0;
}

export function topDomains(limit = 10): Array<{ domain: string; count: number; hits: number }> {
  return db()
    .prepare(
      `SELECT domain, COUNT(*) AS count, SUM(hit_count) AS hits
       FROM preview_sessions
       GROUP BY domain
       ORDER BY count DESC
       LIMIT ?`,
    )
    .all(limit) as Array<{ domain: string; count: number; hits: number }>;
}

export function topCreatorIps(limit = 10): Array<{ ip: string; count: number }> {
  return db()
    .prepare(
      `SELECT creator_ip AS ip, COUNT(*) AS count
       FROM preview_sessions
       WHERE creator_ip IS NOT NULL AND creator_ip != ''
       GROUP BY creator_ip
       ORDER BY count DESC
       LIMIT ?`,
    )
    .all(limit) as Array<{ ip: string; count: number }>;
}

export function recentSessions(limit = 10): AdminPreviewRow[] {
  return listAllSessionsAdmin({ limit });
}

export function sessionsCreatedSince(sinceMs: number): number {
  const r = db()
    .prepare("SELECT COUNT(*) AS n FROM preview_sessions WHERE created_at >= ?")
    .get(sinceMs) as { n: number };
  return r.n;
}

export function hitsSince(_sinceMs: number): number {
  // We don't timestamp individual hits, so this is approximate: sum of hit_count
  // for sessions created since `since`. Good enough for the dashboard.
  const r = db()
    .prepare("SELECT SUM(hit_count) AS n FROM preview_sessions WHERE created_at >= ?")
    .get(_sinceMs) as { n: number | null };
  return r.n ?? 0;
}
