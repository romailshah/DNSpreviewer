import http, { type IncomingMessage, type RequestOptions } from "node:http";
import https from "node:https";
import { Readable } from "node:stream";
import { URL } from "node:url";
import { MAX_REWRITE_MB } from "./env";
import type { PreviewSession } from "./sessions";
import { effectiveDomain } from "./validation";

const MAX_REWRITE_BYTES = MAX_REWRITE_MB * 1024 * 1024;

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
]);

export interface ProxyRequest {
  method: string;
  pathWithQuery: string;
  headers: Headers;
  body: ReadableStream<Uint8Array> | null;
  clientIp: string;
  previewHost: string; // host + optional port as seen by the browser, e.g. "abc.dnspreviewer.com" or "abc.localhost:3000"
  previewScheme: "http" | "https"; // scheme as seen by the browser
  vhostOverride?: string | null; // for wildcard/multisite
}

export async function proxy(session: PreviewSession, req: ProxyRequest): Promise<Response> {
  const baseDomain = effectiveDomain(session.domain, session.siteType, session.subdomain);
  const effectiveHost = req.vhostOverride || baseDomain;

  const protocols: Array<"https" | "http"> =
    session.protocol === "https"
      ? ["https"]
      : session.protocol === "http"
        ? ["http"]
        : ["https", "http"];

  let lastErr: Error | null = null;
  for (const scheme of protocols) {
    try {
      return await proxyOne(session, req, scheme, effectiveHost);
    } catch (e) {
      lastErr = e as Error;
    }
  }
  throw lastErr ?? new Error("Upstream failed");
}

async function proxyOne(
  session: PreviewSession,
  req: ProxyRequest,
  scheme: "https" | "http",
  effectiveHost: string,
): Promise<Response> {
  const port = session.port ?? (scheme === "https" ? 443 : 80);
  const isHttps = scheme === "https";
  const targetHost = session.target;

  const upstreamHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    upstreamHeaders[key] = value;
  });
  upstreamHeaders["host"] = effectiveHost;
  upstreamHeaders["accept-encoding"] = "identity";
  upstreamHeaders["x-forwarded-for"] = req.clientIp;
  upstreamHeaders["x-forwarded-proto"] = isHttps ? "https" : "http";
  upstreamHeaders["x-forwarded-host"] = effectiveHost;

  const options: RequestOptions & { servername?: string; rejectUnauthorized?: boolean } = {
    host: targetHost,
    port,
    method: req.method,
    path: req.pathWithQuery,
    headers: upstreamHeaders,
    timeout: 20_000,
  };
  if (isHttps) {
    options.servername = effectiveHost;
    options.rejectUnauthorized = false;
  }

  const upstreamRes: IncomingMessage = await new Promise((resolve, reject) => {
    const mod = isHttps ? https : http;
    const r = mod.request(options, resolve);
    r.on("error", reject);
    r.on("timeout", () => r.destroy(new Error("Upstream timeout")));

    if (req.body) {
      Readable.fromWeb(req.body as unknown as import("stream/web").ReadableStream<Uint8Array>).pipe(r);
    } else {
      r.end();
    }
  });

  const baseDomain = effectiveDomain(session.domain, session.siteType, session.subdomain);
  const outHeaders = new Headers();
  for (const [k, v] of Object.entries(upstreamRes.headers)) {
    if (v == null) continue;
    const lower = k.toLowerCase();
    if (HOP_BY_HOP.has(lower)) continue;
    if (lower === "content-encoding") continue;
    if (lower === "content-length") continue;
    if (lower === "strict-transport-security") continue;
    if (lower === "x-frame-options") continue;
    if (lower === "content-security-policy") continue;
    if (lower === "content-security-policy-report-only") continue;
    if (lower === "set-cookie") {
      const list = Array.isArray(v) ? v : [v];
      for (const c of list) {
        outHeaders.append("set-cookie", rewriteSetCookie(c, req.previewScheme));
      }
      continue;
    }
    if (lower === "location") {
      const rewritten = rewriteLocation(
        String(v),
        baseDomain,
        session.siteType,
        req.previewHost,
        req.previewScheme,
      );
      outHeaders.set("location", rewritten);
      continue;
    }
    outHeaders.set(k, Array.isArray(v) ? v.join(", ") : String(v));
  }

  const contentType = (upstreamRes.headers["content-type"] || "").toString().toLowerCase();
  const shouldRewrite =
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml") ||
    contentType.includes("text/css");

  if (shouldRewrite) {
    const buf = await readBodyWithLimit(upstreamRes, MAX_REWRITE_BYTES);
    if (!buf.truncated) {
      const text = buf.data.toString("utf8");
      const rewritten = contentType.includes("css")
        ? rewriteCss(text, baseDomain, session.siteType, req.previewHost)
        : rewriteHtml(text, baseDomain, session.siteType, req.previewHost);
      outHeaders.set("content-type", contentType);
      return new Response(rewritten, {
        status: upstreamRes.statusCode ?? 200,
        headers: outHeaders,
      });
    }
    return new Response(buf.data, {
      status: upstreamRes.statusCode ?? 200,
      headers: outHeaders,
    });
  }

  const stream = Readable.toWeb(upstreamRes) as unknown as ReadableStream<Uint8Array>;
  return new Response(stream, {
    status: upstreamRes.statusCode ?? 200,
    headers: outHeaders,
  });
}

async function readBodyWithLimit(
  res: IncomingMessage,
  maxBytes: number,
): Promise<{ data: Buffer; truncated: boolean }> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of res) {
    const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += b.length;
    if (size > maxBytes) {
      chunks.push(b);
      res.destroy();
      return { data: Buffer.concat(chunks), truncated: true };
    }
    chunks.push(b);
  }
  return { data: Buffer.concat(chunks), truncated: false };
}

export function rewriteHtml(
  html: string,
  baseDomain: string,
  siteType: string,
  previewHost: string,
): string {
  const ud = escapeRegex(baseDomain);
  let out = html;

  // Rewrite exact domain URLs: //example.com/path -> //preview/path
  out = out.replace(
    new RegExp(`(https?:)?//${ud}(?=[/"'?#\\s>])`, "gi"),
    `//${previewHost}`,
  );

  if (siteType === "wildcard") {
    // Rewrite subdomain references: //sub.example.com/path -> //preview/__vhost/sub.example.com/path
    out = out.replace(
      new RegExp(`(https?:)?//([a-z0-9-]+\\.${ud})(?=[/"'?#\\s>])`, "gi"),
      (_m, _proto, host) => `//${previewHost}/__vhost/${host}`,
    );
  }

  const banner = bannerHtml(baseDomain, previewHost);
  if (/<body[^>]*>/i.test(out)) {
    out = out.replace(/<body([^>]*)>/i, `<body$1>${banner}`);
  }
  return out;
}

export function rewriteCss(
  css: string,
  baseDomain: string,
  siteType: string,
  previewHost: string,
): string {
  const ud = escapeRegex(baseDomain);
  let out = css.replace(new RegExp(`(https?:)?//${ud}(?=[/"'?#)\\s])`, "gi"), `//${previewHost}`);
  if (siteType === "wildcard") {
    out = out.replace(
      new RegExp(`(https?:)?//([a-z0-9-]+\\.${ud})(?=[/"'?#)\\s])`, "gi"),
      (_m, _proto, host) => `//${previewHost}/__vhost/${host}`,
    );
  }
  return out;
}

function rewriteLocation(
  location: string,
  baseDomain: string,
  siteType: string,
  previewHost: string,
  previewScheme: "http" | "https",
): string {
  try {
    const abs = new URL(location, `https://${baseDomain}`);
    const h = abs.hostname.toLowerCase();
    if (h === baseDomain.toLowerCase()) {
      // Build the redirect target using the browser-facing origin so scheme+port survive.
      return `${previewScheme}://${previewHost}${abs.pathname}${abs.search}${abs.hash}`;
    }
    if (siteType === "wildcard" && h.endsWith(`.${baseDomain.toLowerCase()}`)) {
      return `${previewScheme}://${previewHost}/__vhost/${h}${abs.pathname}${abs.search}${abs.hash}`;
    }
    return location;
  } catch {
    return location;
  }
}

function rewriteSetCookie(cookie: string, previewScheme: "http" | "https"): string {
  // Upstream Domain= attributes always point at the user's real domain, never the preview host.
  let out = cookie.replace(/;\s*domain=[^;]*/gi, "");
  // If the browser is on plain HTTP (dev mode or HTTP-only preview), strip Secure so cookies work.
  if (previewScheme === "http") {
    out = out.replace(/;\s*secure/gi, "");
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bannerHtml(userDomain: string, previewHost: string): string {
  const style =
    "position:fixed;left:12px;bottom:12px;z-index:2147483647;font:12px system-ui,sans-serif;" +
    "background:#ff7200;color:#fff;padding:8px 12px;border-radius:8px;box-shadow:0 6px 20px rgba(255,114,0,.35);" +
    "max-width:320px;";
  const close =
    "margin-left:8px;cursor:pointer;color:rgba(255,255,255,.75);text-decoration:none;font-size:14px;line-height:1;";
  return (
    `<div id="__dnsp_banner" style="${style}">` +
    `<strong>DNS Previewer</strong> — previewing <code style="background:rgba(0,0,0,.15);padding:1px 5px;border-radius:3px">${escapeHtml(userDomain)}</code>` +
    ` <a href="#" style="${close}" onclick="document.getElementById('__dnsp_banner').remove();return false;">&times;</a>` +
    `</div>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
