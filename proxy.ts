import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "localhost";
const ID_RE = /^[a-z0-9]{6,16}$/;

export const config = {
  matcher: [
    // Run on every request except Next internals and static assets served from the apex.
    "/((?!_next/static|_next/image|favicon.ico).*)",
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
