import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getClientIp } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activity";
import { createFeedback, feedbackCountRecentByIp, feedbackSchema, FEEDBACK_PER_HOUR } from "@/lib/feedback";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    // A filled honeypot gets a fake success so the bot learns nothing.
    if (issue?.path[0] === "website") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "invalid", message: issue?.message ?? "Check the form." }, { status: 400 });
  }

  if (feedbackCountRecentByIp(ip) >= FEEDBACK_PER_HOUR) {
    return NextResponse.json(
      { error: "rate_limited", message: "You've sent a few messages already. Try again in an hour, or email hello@dnspreviewer.com." },
      { status: 429 },
    );
  }

  const user = await currentUser();
  const { kind, message, email, page } = parsed.data;
  // A quote request with no way to reply is useless, so insist on an email.
  if (kind === "help" && !email && !user) {
    return NextResponse.json(
      { error: "invalid", message: "Add your email so I can send you the quote." },
      { status: 400 },
    );
  }
  const id = createFeedback({
    kind,
    message,
    email: email || user?.email || null,
    page: page || null,
    userId: user?.id ?? null,
    ip,
    userAgent: req.headers.get("user-agent"),
  });
  logActivity("feedback.received", { userId: user?.id, ip, details: { id, kind, page } });

  return NextResponse.json({ ok: true });
}
