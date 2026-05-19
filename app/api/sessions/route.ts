import { NextRequest, NextResponse } from "next/server";
import { createSessionSchema } from "@/lib/validation";
import { createSession, listSessionsByUser } from "@/lib/sessions";
import { checkCreateRateLimit, getClientIp } from "@/lib/rateLimit";
import { assertHostResolvesPublic } from "@/lib/security";
import { ROOT_DOMAIN, SESSION_TTL_MINUTES } from "@/lib/env";
import { currentUser, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await currentUser();
  const ip = getClientIp(req.headers);

  if (!user) {
    const limit = checkCreateRateLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "rate_limited",
          message: `You've created ${limit.used} previews in the last hour (limit ${limit.limit}). Sign up for unlimited.`,
        },
        { status: 429 },
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // no-expiry and password are account-only features
  if (!user && data.noExpiry) {
    return NextResponse.json(
      { error: "login_required", message: "No-expiry links require an account. It's free — sign up to enable." },
      { status: 403 },
    );
  }
  if (!user && data.password) {
    return NextResponse.json(
      { error: "login_required", message: "Password-protected previews require an account. It's free — sign up to enable." },
      { status: 403 },
    );
  }

  try {
    await assertHostResolvesPublic(data.target);
  } catch (e) {
    return NextResponse.json(
      { error: "target_unreachable", message: (e as Error).message },
      { status: 400 },
    );
  }

  const passwordHash = data.password ? await hashPassword(data.password) : null;

  const session = createSession({
    userId: user?.id ?? null,
    label: data.label || null,
    domain: data.domain,
    target: data.target,
    protocol: data.protocol,
    port: data.port ?? null,
    siteType: data.siteType,
    subdomain: data.subdomain || null,
    passwordHash,
    creatorIp: ip,
    noExpiry: Boolean(data.noExpiry),
  });

  logActivity("preview.created", {
    userId: user?.id ?? null,
    ip,
    details: {
      sessionId: session.id,
      domain: session.domain,
      target: session.target,
      siteType: session.siteType,
      protocol: session.protocol,
      passwordProtected: Boolean(session.passwordHash),
      noExpiry: session.expiresAt === null,
    },
  });

  const previewHost = `${session.id}.${ROOT_DOMAIN}`;

  return NextResponse.json({
    id: session.id,
    label: session.label,
    domain: session.domain,
    target: session.target,
    protocol: session.protocol,
    siteType: session.siteType,
    subdomain: session.subdomain,
    passwordProtected: Boolean(session.passwordHash),
    previewHost,
    previewUrl: previewHost.endsWith(".localhost") ? `http://${previewHost}:3000/` : `https://${previewHost}/`,
    expiresAt: session.expiresAt,
    ttlMinutes: SESSION_TTL_MINUTES,
    noExpiry: session.expiresAt === null,
  });
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ sessions: [] });
  const sessions = listSessionsByUser(user.id).map((s) => ({
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
  }));
  return NextResponse.json({ sessions });
}
