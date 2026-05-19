import { z } from "zod";
import { isBlockedTarget } from "./security";

const HOSTNAME_RE = /^(?=.{1,253}$)(?!-)([a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,63}$/;
const LABEL_RE = /^[a-zA-Z0-9-]{1,63}$/;

export const createSessionSchema = z
  .object({
    domain: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(253)
      .refine((d) => HOSTNAME_RE.test(d), "Must be a valid domain like example.com"),
    target: z
      .string()
      .trim()
      .min(1)
      .max(253)
      .refine(
        (t) => HOSTNAME_RE.test(t) || isIpLiteral(t),
        "Target must be a public IP address or hostname",
      ),
    protocol: z.enum(["https", "http", "both"]).default("https"),
    port: z.number().int().min(1).max(65535).optional().nullable(),
    siteType: z.enum(["regular", "wildcard", "subdomain"]).default("regular"),
    subdomain: z
      .string()
      .trim()
      .toLowerCase()
      .max(63)
      .optional()
      .nullable()
      .refine((s) => !s || LABEL_RE.test(s), "Subdomain must be a DNS label (letters, digits, hyphens)"),
    label: z.string().trim().max(80).optional().nullable(),
    password: z.string().min(1).max(200).optional().nullable(),
    noExpiry: z.boolean().optional().default(false),
  })
  .refine(
    (v) => v.siteType !== "subdomain" || (v.subdomain && v.subdomain.length > 0),
    { message: "Subdomain is required for 'Specific Subdomain' site type", path: ["subdomain"] },
  )
  .refine((v) => !isBlockedTarget(v.target, v.domain), {
    message: "This target is not allowed",
    path: ["target"],
  });

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export function isIpLiteral(value: string): boolean {
  if (value.includes(":")) return isIpv6(value);
  return isIpv4(value);
}

function isIpv4(v: string): boolean {
  const parts = v.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

function isIpv6(v: string): boolean {
  if (v.length > 45) return false;
  if (!/^[0-9a-fA-F:]+$/.test(v)) return false;
  const parts = v.split("::");
  if (parts.length > 2) return false;
  const groups = v.split(":").filter(Boolean);
  return groups.length <= 8 && groups.every((g) => /^[0-9a-fA-F]{1,4}$/.test(g));
}

export function effectiveDomain(domain: string, siteType: string, subdomain: string | null): string {
  if (siteType === "subdomain" && subdomain) return `${subdomain}.${domain}`;
  return domain;
}
