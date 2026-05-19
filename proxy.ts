import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "localhost";
const ID_RE = /^[a-z0-9]{6,16}$/;

export const config = {
  matcher: [
    // Match (almost) every request — the function decides based on the host
    // header whether to rewrite (preview subdomain) or pass through (apex).
    //
    // Why we DON'T exclude `_next/static|_next/image|favicon.ico` here:
    // For the apex domain those are served by Next.js's own handlers, and
    // running middleware for them is a 1-call no-op (`NextResponse.next()`).
    // For preview subdomains, the upstream site's HTML references the SAME
    // `/_next/static/...` paths (lots of upstreams are Next.js apps too),
    // and excluding them would let Next.js's static handler intercept and
    // 404 them instead of forwarding to the proxy. So: match everything.
    //
    // We DO exclude `/api/proxy/` to avoid the middleware firing again on
    // the rewritten internal path (cheap safety; the function also handles
    // this case defensively).
    "/((?!api/proxy/).*)",
  ],
};

export function proxy(req: NextRequest) {
  const rawHost = req.headers.get("host") || "";
  const host = rawHost.split(":")[0].toLowerCase();

  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return NextResponse.next();
  }

  if (!host.endsWith(`.${ROOT_DOMAIN}`)) {
    return NextResponse.next();
  }

  const sub = host.slice(0, host.length - ROOT_DOMAIN.length - 1);
  if (sub.includes(".") || !ID_RE.test(sub)) {
    return new NextResponse("Preview not found", { status: 404 });
  }

  const url = req.nextUrl.clone();
  const original = url.pathname;

  // Safety: if something ever leaks the internal API path into the browser URL
  // (e.g. a framework redirect), don't double-wrap it.
  if (original.startsWith("/api/proxy/")) {
    return NextResponse.next();
  }

  url.pathname = `/api/proxy/${sub}${original === "/" ? "" : original}`;
  return NextResponse.rewrite(url);
}
