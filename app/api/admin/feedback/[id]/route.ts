import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { setFeedbackStatus } from "@/lib/feedback";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.code }, { status: 403 });
    throw e;
  }
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: unknown } | null;
  const status = body?.status;
  if (status !== "new" && status !== "done") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  const ok = setFeedbackStatus(Number(id), status);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
