import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runBackup } from "@/lib/backup";
import { CRON_SECRET } from "@/lib/env";
import { logActivity, pruneActivity } from "@/lib/activity";
import { sweepExpired } from "@/lib/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  // Fail closed: an unset secret means nobody can trigger this, rather than
  // everybody.
  if (!CRON_SECRET) return false;
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(CRON_SECRET);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBackup();

    // Housekeeping, after the snapshot so the backup captures the fuller
    // history. The scripts/ helpers aren't shipped in the standalone image,
    // so this daily call is where routine pruning actually happens.
    sweepExpired();
    const prunedActivity = pruneActivity(90);
    logActivity("backup.succeeded", {
      userId: null,
      ip: null,
      details: {
        key: result.key,
        rawBytes: result.rawBytes,
        uploadedBytes: result.uploadedBytes,
        durationMs: result.durationMs,
        prunedActivity,
      },
    });
    return NextResponse.json({ ok: true, ...result, prunedActivity });
  } catch (e) {
    const message = (e as Error).message;
    logActivity("backup.failed", { userId: null, ip: null, details: { message } });
    console.error("[backup] failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
