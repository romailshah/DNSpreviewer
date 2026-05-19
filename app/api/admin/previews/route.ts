import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { listAllSessionsAdmin } from "@/lib/sessions";

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
  const statusRaw = url.searchParams.get("status") || "all";
  const status: "all" | "active" | "expired" | "disabled" =
    statusRaw === "active" || statusRaw === "expired" || statusRaw === "disabled"
      ? statusRaw
      : "all";
  const search = url.searchParams.get("q") || "";
  const limit = Math.min(500, Number(url.searchParams.get("limit") || 200) || 200);
  const offset = Math.max(0, Number(url.searchParams.get("offset") || 0) || 0);

  const rows = listAllSessionsAdmin({ limit, offset, search, status });
  return NextResponse.json({
    previews: rows.map((s) => ({
      id: s.id,
      label: s.label,
      domain: s.domain,
      target: s.target,
      protocol: s.protocol,
      siteType: s.siteType,
      subdomain: s.subdomain,
      passwordProtected: Boolean(s.passwordHash),
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      disabled: s.disabled,
      hitCount: s.hitCount,
      creatorIp: s.creatorIp,
      userEmail: s.userEmail,
      userId: s.userId,
    })),
  });
}
