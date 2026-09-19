import { NextRequest, NextResponse } from "next/server";
import { AFFILIATES, isAffiliatePartner } from "@/lib/affiliates";
import { logActivity } from "@/lib/activity";
import { getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /go/<partner> -> the partner's affiliate URL. Logs the click with the page
 * it came from, so the admin can see which pages actually send buyers.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ partner: string }> }) {
  const { partner } = await params;
  if (!isAffiliatePartner(partner)) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  let from: string | null = null;
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const r = new URL(referer);
      from = r.pathname;
    } catch {}
  }
  // Which placement was clicked (top-bar, home-hero, post-card), so the
  // admin can compare them. Kept short and to a safe character set.
  const src = (req.nextUrl.searchParams.get("src") ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 32) || null;
  logActivity("affiliate.click", { ip: getClientIp(req.headers), details: { partner, src, from } });

  const res = NextResponse.redirect(AFFILIATES[partner].url, 302);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
