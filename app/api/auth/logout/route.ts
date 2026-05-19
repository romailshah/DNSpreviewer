import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearAuthCookie, revokeSession, userFromToken } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const c = await cookies();
  const token = c.get("dnsp_session")?.value;
  const user = userFromToken(token);
  if (token) revokeSession(token);
  await clearAuthCookie();
  if (user) {
    logActivity("user.logout", { userId: user.id, ip: getClientIp(req.headers) });
  }
  return NextResponse.json({ ok: true });
}
