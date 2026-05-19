import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { activityCount, recentActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.code }, { status: 403 });
    throw e;
  }

  const url = new URL(req.url);
  const limit = Math.min(500, Number(url.searchParams.get("limit") || 100) || 100);
  const offset = Math.max(0, Number(url.searchParams.get("offset") || 0) || 0);

  return NextResponse.json({
    activity: recentActivity(limit, offset),
    total: activityCount(),
  });
}
