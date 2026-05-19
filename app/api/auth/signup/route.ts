import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, issueSession, setAuthCookie, signup } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  try {
    const user = await signup(parsed.data.email, parsed.data.password);
    const { token, expiresAt } = issueSession(user.id);
    const secure = req.nextUrl.protocol === "https:";
    await setAuthCookie(token, expiresAt, secure);
    logActivity("user.signup", {
      userId: user.id,
      ip: getClientIp(req.headers),
      details: { email: user.email },
    });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.code, message: e.message }, { status: 400 });
    }
    throw e;
  }
}
