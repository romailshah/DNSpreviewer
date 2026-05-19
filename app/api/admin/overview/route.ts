import { NextResponse } from "next/server";
import { AuthError, countAdmins, countUsers, requireAdmin } from "@/lib/auth";
import {
  countAllSessions,
  hitsSince,
  recentSessions,
  sessionsCreatedSince,
  topCreatorIps,
  topDomains,
  totalHits,
} from "@/lib/sessions";
import { activityCount, recentActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.code }, { status: 403 });
    }
    throw e;
  }
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const counts = countAllSessions();
  return NextResponse.json({
    users: { total: countUsers(), admins: countAdmins() },
    previews: counts,
    hits: {
      total: totalHits(),
      last24h: hitsSince(now - day),
      last7d: hitsSince(now - 7 * day),
    },
    createdLast24h: sessionsCreatedSince(now - day),
    createdLast7d: sessionsCreatedSince(now - 7 * day),
    topDomains: topDomains(10),
    topIps: topCreatorIps(10),
    recentPreviews: recentSessions(10),
    recentActivity: recentActivity(20),
    activityTotal: activityCount(),
  });
}
