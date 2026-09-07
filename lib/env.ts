import { DEFAULT_BLOCKED_HOSTS } from "./blocklist";

export const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "localhost";
export const SESSION_TTL_MINUTES = Number(process.env.SESSION_TTL_MINUTES || 15);
export const RATE_LIMIT_PER_HOUR = Number(process.env.RATE_LIMIT_PER_HOUR || 10);
export const MAX_REWRITE_MB = Number(process.env.MAX_REWRITE_MB || 4);
export const AUTH_SECRET = process.env.AUTH_SECRET || "dev-only-secret-not-for-production";
export const DATABASE_PATH = process.env.DATABASE_PATH || "./data/dnspreviewer.db";

function hostList(raw: string | undefined): string[] {
  return (raw || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Hosts that may never be proxied or previewed. The built-in list in
 * blocklist.ts covers the phishing targets that get a wildcard domain
 * blacklisted fastest (banks, webmail, payment, identity providers).
 * BLOCKED_HOSTS adds to that list; BLOCKED_HOSTS_ALLOW removes from it, for
 * the rare case where a customer legitimately owns a listed domain.
 */
export const BLOCKED_HOSTS = (() => {
  const allow = new Set(hostList(process.env.BLOCKED_HOSTS_ALLOW));
  const set = new Set<string>();
  for (const h of [...DEFAULT_BLOCKED_HOSTS, ...hostList(process.env.BLOCKED_HOSTS)]) {
    if (!allow.has(h)) set.add(h);
  }
  return set;
})();

export const SESSION_TTL_MS = SESSION_TTL_MINUTES * 60 * 1000;

// ─── Abuse prevention (Cloudflare Turnstile) ────────────────────────────────
// Both must be set for the captcha to be enforced. Unset = disabled, so local
// dev and self-hosters work with no configuration.
export const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY || "";
export const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
export const TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY && TURNSTILE_SECRET_KEY);

// ─── Scheduled jobs ─────────────────────────────────────────────────────────
// Shared bearer token for /api/cron/* endpoints. Unset = endpoints refuse all
// requests (fail closed).
export const CRON_SECRET = process.env.CRON_SECRET || "";

// ─── Off-host backups (any S3-compatible bucket: R2, B2, S3, Wasabi) ────────
export const BACKUP_S3_ENDPOINT = process.env.BACKUP_S3_ENDPOINT || "";
export const BACKUP_S3_REGION = process.env.BACKUP_S3_REGION || "auto";
export const BACKUP_S3_BUCKET = process.env.BACKUP_S3_BUCKET || "";
export const BACKUP_S3_ACCESS_KEY_ID = process.env.BACKUP_S3_ACCESS_KEY_ID || "";
export const BACKUP_S3_SECRET_ACCESS_KEY = process.env.BACKUP_S3_SECRET_ACCESS_KEY || "";
export const BACKUP_S3_PREFIX = process.env.BACKUP_S3_PREFIX || "dnspreviewer";
export const BACKUP_ENABLED = Boolean(
  BACKUP_S3_ENDPOINT && BACKUP_S3_BUCKET && BACKUP_S3_ACCESS_KEY_ID && BACKUP_S3_SECRET_ACCESS_KEY,
);
