import tls from "node:tls";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BACKUP_ENABLED, ROOT_DOMAIN, TURNSTILE_ENABLED } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKUP_STALE_HOURS = 36;
const CERT_WARN_DAYS = 21;

/**
 * Liveness + readiness.
 *
 * Plain GET is cheap enough for a 5-minute uptime monitor. `?deep=1` also
 * checks the two things that fail silently — a stale backup and an expiring
 * wildcard certificate — and returns 503 so a scheduled check can alert on it.
 * A failed wildcard renewal breaks every preview link while the marketing site
 * keeps returning a healthy 200, so it needs its own signal.
 */
export async function GET(req: NextRequest) {
  const deep = req.nextUrl.searchParams.get("deep") === "1";
  const problems: string[] = [];

  let previews: number | null = null;
  let users: number | null = null;
  let dbOk = true;
  try {
    const row = db()
      .prepare(
        "SELECT (SELECT COUNT(*) FROM preview_sessions) AS previews, (SELECT COUNT(*) FROM users) AS users",
      )
      .get() as { previews: number; users: number };
    previews = row.previews;
    users = row.users;
  } catch (e) {
    dbOk = false;
    problems.push(`database: ${(e as Error).message}`);
  }

  const body: Record<string, unknown> = {
    status: "ok",
    db: dbOk ? "ok" : "error",
    previews,
    users,
    backupsConfigured: BACKUP_ENABLED,
    captchaEnabled: TURNSTILE_ENABLED,
    time: new Date().toISOString(),
  };

  if (deep) {
    if (BACKUP_ENABLED && dbOk) {
      const last = lastBackupAt();
      body.lastBackupAt = last ? new Date(last).toISOString() : null;
      const ageHours = last ? (Date.now() - last) / 3_600_000 : Infinity;
      body.lastBackupAgeHours = Number.isFinite(ageHours) ? Math.round(ageHours) : null;
      if (ageHours > BACKUP_STALE_HOURS) {
        problems.push(
          last
            ? `backup is ${Math.round(ageHours)}h old (threshold ${BACKUP_STALE_HOURS}h)`
            : "no successful backup on record",
        );
      }
    }

    if (ROOT_DOMAIN !== "localhost") {
      try {
        const days = await wildcardCertDaysRemaining();
        body.certDaysRemaining = days;
        if (days < CERT_WARN_DAYS) {
          problems.push(`wildcard certificate expires in ${days} days`);
        }
      } catch (e) {
        problems.push(`certificate check failed: ${(e as Error).message}`);
      }
    }
  }

  if (problems.length > 0) {
    body.status = "degraded";
    body.problems = problems;
    return NextResponse.json(body, { status: 503 });
  }
  return NextResponse.json(body);
}

function lastBackupAt(): number | null {
  try {
    const row = db()
      .prepare("SELECT MAX(created_at) AS t FROM activity_log WHERE kind = 'backup.succeeded'")
      .get() as { t: number | null };
    return row?.t ?? null;
  } catch {
    return null;
  }
}

/** Days until the wildcard cert served for preview subdomains expires. */
function wildcardCertDaysRemaining(): Promise<number> {
  const servername = `healthcheck.${ROOT_DOMAIN}`;
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host: ROOT_DOMAIN, port: 443, servername, timeout: 8000 },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) return reject(new Error("no peer certificate"));
        const ms = new Date(cert.valid_to).getTime() - Date.now();
        resolve(Math.floor(ms / 86_400_000));
      },
    );
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("timeout"));
    });
    socket.on("error", reject);
  });
}
