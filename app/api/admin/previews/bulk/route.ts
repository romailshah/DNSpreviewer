import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { deleteSession, getSessionRaw, setSessionDisabled } from "@/lib/sessions";
import { logActivity } from "@/lib/activity";
import { getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BulkAction = "disable" | "enable" | "delete";

interface BulkBody {
  ids?: unknown;
  action?: unknown;
}

const MAX_BULK = 500;

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.code }, { status: 403 });
    throw e;
  }

  const body = (await req.json().catch(() => ({}))) as BulkBody;
  const action = body.action;
  if (action !== "disable" && action !== "enable" && action !== "delete") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ error: "invalid_ids" }, { status: 400 });
  }
  const ids = (body.ids as unknown[])
    .filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 64)
    .slice(0, MAX_BULK);
  if (ids.length === 0) {
    return NextResponse.json({ error: "no_ids" }, { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const results: { id: string; ok: boolean; reason?: string }[] = [];

  for (const id of ids) {
    const s = getSessionRaw(id);
    if (!s) {
      results.push({ id, ok: false, reason: "not_found" });
      continue;
    }
    try {
      if (action === "delete") {
        deleteSession(id);
        logActivity("preview.deleted", {
          userId: admin.id,
          ip,
          details: { sessionId: id, byAdmin: true, bulk: true },
        });
      } else {
        const disabled = action === "disable";
        setSessionDisabled(id, disabled);
        logActivity(disabled ? "preview.disabled" : "preview.enabled", {
          userId: admin.id,
          ip,
          details: { sessionId: id, byAdmin: true, bulk: true },
        });
      }
      results.push({ id, ok: true });
    } catch (err) {
      results.push({ id, ok: false, reason: err instanceof Error ? err.message : "error" });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  return NextResponse.json({
    action: action as BulkAction,
    requested: ids.length,
    succeeded,
    failed: ids.length - succeeded,
    results,
  });
}
