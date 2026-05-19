import { countRecentByIp } from "./sessions";
import { RATE_LIMIT_PER_HOUR } from "./env";

const HOUR_MS = 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetInMs: number;
}

export function checkCreateRateLimit(ip: string): RateLimitResult {
  const used = countRecentByIp(ip, HOUR_MS);
  return {
    allowed: used < RATE_LIMIT_PER_HOUR,
    used,
    limit: RATE_LIMIT_PER_HOUR,
    resetInMs: HOUR_MS,
  };
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = headers.get("x-real-ip");
  if (xri) return xri.trim();
  const cfip = headers.get("cf-connecting-ip");
  if (cfip) return cfip.trim();
  return "unknown";
}
