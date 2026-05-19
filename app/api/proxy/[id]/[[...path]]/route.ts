import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getSession, recordHit } from "@/lib/sessions";
import { proxy, type ProxyRequest } from "@/lib/proxy";
import { getClientIp } from "@/lib/rateLimit";
import { ROOT_DOMAIN } from "@/lib/env";
import { comparePassword, unlockToken, verifyUnlockToken } from "@/lib/auth";
import { expiredPage, unlockPage, upstreamErrorPage } from "@/lib/pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; path?: string[] }> };

/**
 * Derive the browser-facing preview origin from the inbound request.
 * `previewHost` includes the port when the browser is using a non-default one
 * (e.g. `abc.localhost:3000` in dev). `previewScheme` reflects what the
 * browser actually used (checks X-Forwarded-Proto for production behind Caddy).
 */
function deriveOrigin(req: NextRequest, id: string): { host: string; scheme: "http" | "https" } {
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim().toLowerCase();
  const urlScheme = new URL(req.url).protocol.replace(":", "").toLowerCase();
  const scheme: "http" | "https" = (forwardedProto || urlScheme) === "https" ? "https" : "http";

  const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const host = hostHeader || `${id}.${ROOT_DOMAIN}`;
  return { host, scheme };
}

/**
 * Critical: every preview-subdomain response MUST be `noindex` so Google never
 * indexes the third-party content we're proxying under our own domain. Doing
 * this for ALL paths from this route (proxy, expired, unlock, error) keeps
 * the contract simple and impossible to forget at a single call site.
 */
function withNoindex(res: Response): Response {
  try {
    res.headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    return res;
  } catch {
    // Some Response objects (e.g. from Response.redirect) have immutable headers
    // depending on the runtime. Fall back to cloning into a new Response.
    const headers = new Headers(res.headers);
    headers.set("x-robots-tag", "noindex, nofollow, noarchive");
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }
}

async function handle(req: NextRequest, ctx: Ctx): Promise<Response> {
  return withNoindex(await innerHandle(req, ctx));
}

async function innerHandle(req: NextRequest, ctx: Ctx): Promise<Response> {
  const { id, path = [] } = await ctx.params;
  const session = getSession(id);
  if (!session) {
    return htmlResponse(expiredPage(id), 410);
  }
  const { host: previewHost, scheme: previewScheme } = deriveOrigin(req, id);

  if (req.method === "POST" && path[0] === "__unlock") {
    return handleUnlock(req, session, previewHost, previewScheme);
  }

  if (session.passwordHash) {
    const c = await cookies();
    const token = c.get(`dnsp_unlock_${id}`)?.value;
    const ok = token && verifyUnlockToken(token, id, session.passwordHash);
    if (!ok) {
      return htmlResponse(unlockPage(id, previewHost, false), 401);
    }
  }

  let effectivePath = path;
  let vhostOverride: string | null = null;
  if (path[0] === "__vhost" && path.length >= 2) {
    vhostOverride = path[1];
    effectivePath = path.slice(2);
  }

  recordHit(id);

  const url = new URL(req.url);
  // Preserve the trailing slash from the original URL — WordPress & others treat
  // `/about` and `/about/` as different pages and will 301 one to the other.
  // Next param-split loses this info, so check url.pathname directly.
  const trailingSlash = url.pathname.endsWith("/") && effectivePath.length > 0;
  const pathOnly =
    effectivePath.length === 0
      ? "/"
      : "/" + effectivePath.map(encodeURIComponent).join("/") + (trailingSlash ? "/" : "");
  const pathWithQuery = url.search ? pathOnly + url.search : pathOnly;

  const proxyReq: ProxyRequest = {
    method: req.method,
    pathWithQuery,
    headers: req.headers,
    body: req.body,
    clientIp: getClientIp(req.headers),
    previewHost,
    previewScheme,
    vhostOverride,
  };

  try {
    return await proxy(session, proxyReq);
  } catch (e) {
    const message = (e as Error).message || "Upstream error";
    return htmlResponse(upstreamErrorPage(session.target, message), 502);
  }
}

async function handleUnlock(
  req: NextRequest,
  session: { id: string; passwordHash: string | null },
  previewHost: string,
  previewScheme: "http" | "https",
): Promise<Response> {
  const previewUrl = `${previewScheme}://${previewHost}/`;
  if (!session.passwordHash) {
    return Response.redirect(previewUrl, 303);
  }
  const form = await req.formData();
  const pw = String(form.get("password") || "");
  const ok = await comparePassword(pw, session.passwordHash);
  if (!ok) {
    return htmlResponse(unlockPage(session.id, previewHost, true), 401);
  }
  const token = unlockToken(session.id, session.passwordHash);
  const secure = previewScheme === "https" ? "; Secure" : "";
  const res = new Response(null, { status: 303, headers: { location: previewUrl } });
  res.headers.append(
    "set-cookie",
    `dnsp_unlock_${session.id}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=86400`,
  );
  return res;
}

function htmlResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
