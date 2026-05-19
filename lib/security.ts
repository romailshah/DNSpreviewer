import { BLOCKED_HOSTS } from "./env";
import { isIpLiteral } from "./validation";

/**
 * IPv4 blocklist for SSRF protection.
 * Covers loopback, RFC1918 private, link-local (including cloud metadata
 * 169.254.169.254 on AWS/GCP/Azure), multicast, broadcast, reserved.
 */
const BLOCKED_V4_RANGES: Array<[number, number]> = [
  cidr("0.0.0.0", 8),
  cidr("10.0.0.0", 8),
  cidr("100.64.0.0", 10),
  cidr("127.0.0.0", 8),
  cidr("169.254.0.0", 16),
  cidr("172.16.0.0", 12),
  cidr("192.0.0.0", 24),
  cidr("192.0.2.0", 24),
  cidr("192.168.0.0", 16),
  cidr("198.18.0.0", 15),
  cidr("198.51.100.0", 24),
  cidr("203.0.113.0", 24),
  cidr("224.0.0.0", 4),
  cidr("240.0.0.0", 4),
  cidr("255.255.255.255", 32),
];

export function isBlockedTarget(target: string, ownDomain: string): boolean {
  const host = target.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host === ownDomain.toLowerCase()) return false;

  if (isIpLiteral(host)) {
    if (host.includes(":")) {
      return isBlockedIpv6(host);
    }
    return isBlockedIpv4(host);
  }

  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "dnspreviewer.com" || host.endsWith(".dnspreviewer.com")) return true;
  return false;
}

function isBlockedIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true;
  return BLOCKED_V4_RANGES.some(([base, mask]) => (n & mask) === (base & mask));
}

function isBlockedIpv6(ip: string): boolean {
  const norm = ip.toLowerCase();
  if (norm === "::" || norm === "::1") return true;
  if (norm.startsWith("fe80:") || norm.startsWith("fe8") || norm.startsWith("fec0:")) return true;
  if (norm.startsWith("fc") || norm.startsWith("fd")) return true; // unique local
  if (norm.startsWith("ff")) return true; // multicast
  if (norm.startsWith("::ffff:")) {
    const v4 = norm.slice(7);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) return isBlockedIpv4(v4);
  }
  return false;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function cidr(base: string, prefixLen: number): [number, number] {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) throw new Error(`invalid base ${base}`);
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return [baseInt >>> 0, mask >>> 0];
}

/**
 * Resolve a hostname and block if any resolved IP is in a private range.
 * Called server-side before making the upstream proxy request.
 */
export async function assertHostResolvesPublic(host: string): Promise<void> {
  if (isIpLiteral(host)) {
    if (isBlockedTarget(host, "")) throw new Error(`Target IP ${host} is in a private range`);
    return;
  }
  const { lookup } = await import("node:dns/promises");
  const records = await lookup(host, { all: true });
  if (records.length === 0) throw new Error(`Could not resolve ${host}`);
  for (const r of records) {
    if (isBlockedTarget(r.address, "")) {
      throw new Error(`${host} resolves to private address ${r.address}`);
    }
  }
}
