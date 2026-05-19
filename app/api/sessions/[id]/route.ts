import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getSessionRaw, setSessionDisabled } from "@/lib/sessions";
import { getClientIp } from "@/lib/rateLimit";
import { ROOT_DOMAIN } from "@/lib/env";
import { currentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const s = getSessionRaw(id);
  if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
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
    previewHost: `${s.id}.${ROOT_DOMAIN}`,
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const s = getSessionRaw(id);
  if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const user = await currentUser();
  const ip = getClientIp(req.headers);
  // Admins can patch anyone's session; owners can patch their own.
  const isAdmin = user?.role === "admin";
  if (!isAdmin && !authorized(s.userId, s.creatorIp, user?.id, ip)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (typeof body.disabled === "boolean") {
    setSessionDisabled(id, body.disabled);
    logActivity(body.disabled ? "preview.disabled" : "preview.enabled", {
      userId: user?.id ?? null,
      ip,
      details: { sessionId: id, byAdmin: isAdmin },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const s = getSessionRaw(id);
  if (!s) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const user = await currentUser();
  const ip = getClientIp(req.headers);
  const isAdmin = user?.role === "admin";
  if (!isAdmin && !authorized(s.userId, s.creatorIp, user?.id, ip)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  deleteSession(id);
  logActivity("preview.deleted", {
    userId: user?.id ?? null,
    ip,
    details: { sessionId: id, byAdmin: isAdmin },
  });
  return NextResponse.json({ ok: true });
}

function authorized(
  ownerUserId: string | null,
  ownerIp: string,
  currentUserId: string | undefined,
  currentIp: string,
): boolean {
  if (ownerUserId) return ownerUserId === currentUserId;
  return ownerIp === currentIp;
}
