export const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "localhost";
export const SESSION_TTL_MINUTES = Number(process.env.SESSION_TTL_MINUTES || 15);
export const RATE_LIMIT_PER_HOUR = Number(process.env.RATE_LIMIT_PER_HOUR || 10);
export const MAX_REWRITE_MB = Number(process.env.MAX_REWRITE_MB || 4);
export const AUTH_SECRET = process.env.AUTH_SECRET || "dev-only-secret-not-for-production";
export const DATABASE_PATH = process.env.DATABASE_PATH || "./data/dnspreviewer.db";

export const BLOCKED_HOSTS = new Set(
  (process.env.BLOCKED_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
);

export const SESSION_TTL_MS = SESSION_TTL_MINUTES * 60 * 1000;
