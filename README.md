# DNS Previewer

Preview your website on a new server before switching DNS. Free, no signup, 15-minute preview URLs.

This is the full source code — a Next.js app that does landing page, preview session management, and the HTTP/HTTPS proxy in a single deployment.

## Local development

Requirements:
- Node.js 20+ (22 recommended)
- A browser that supports `*.localhost` subdomain resolution (Chrome, Firefox, Safari, Edge all do)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Visit http://localhost:3000 to see the landing page.

### Testing the proxy locally

1. Go to http://localhost:3000/create
2. Enter a real public domain + IP. Example that's safe to test against:
   - Domain: `example.com`
   - Target: `93.184.215.14` (example.com's real IP, as of writing)
   - Scheme: HTTPS
3. Submit. You'll get redirected to a page with a preview URL like `http://xxxxxxxxxx.localhost:3000/`
4. Click that URL. Modern browsers resolve `*.localhost` to 127.0.0.1 automatically, so the proxy middleware takes over.

If `*.localhost` doesn't resolve on your system, add an entry to your hosts file:

```
# /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1  xxxxxxxxxx.localhost
```

### Project layout

```
app/
  page.tsx                                # Landing page
  create/page.tsx                          # Preview creation
  s/[id]/page.tsx                          # Session status page
  how-it-works/, faq/, abuse/              # Content pages
  api/
    sessions/route.ts                      # POST/GET sessions
    sessions/[id]/route.ts                 # GET/DELETE one session
    proxy/[id]/[[...path]]/route.ts        # The actual proxy handler
lib/
  env.ts                                   # Config from env vars
  validation.ts                            # Zod schemas
  security.ts                              # SSRF guards (private IP blocklist)
  sessions.ts                              # In-memory session store with TTL
  rateLimit.ts                             # IP rate limiter
  proxy.ts                                 # Node http/https proxy + HTML/CSS rewriter
  pages.ts                                 # Server-rendered error pages
proxy.ts                                   # Wildcard subdomain routing (Next 16 proxy convention)
components/                                # React UI
```

### Environment variables

See `.env.example`. The important ones:

| Variable | Default | Meaning |
|---|---|---|
| `ROOT_DOMAIN` | `localhost` | Apex domain. Set to `dnspreviewer.com` in production. |
| `SESSION_TTL_MINUTES` | `15` | How long a preview stays alive. |
| `RATE_LIMIT_PER_HOUR` | `10` | Max sessions an IP can create per hour. |
| `BLOCKED_HOSTS` | (empty) | Comma-separated target domains to reject. Example: `mybank.com,paypal.com`. |
| `MAX_REWRITE_MB` | `4` | Responses larger than this stream through without link rewriting. |

## Production deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for a step-by-step guide covering:
- VPS sizing and OS setup
- Cloudflare DNS wildcard records
- Wildcard Let's Encrypt cert via Caddy
- systemd service for the Next.js app
- Hardening checklist

## Architecture in one paragraph

Next.js's proxy (root-level `proxy.ts`) inspects the incoming `Host` header. For the apex (`dnspreviewer.com`) it lets the request through to the normal app. For a wildcard subdomain (`abc123.dnspreviewer.com`) it rewrites the request internally to `/api/proxy/abc123/...`, which looks up the session, opens an HTTP/HTTPS connection to the target IP using the user's real domain as the TLS SNI and `Host` header, and streams the response back. HTML and CSS are buffered (up to 4 MB) and rewritten so references to the user's domain point at the preview subdomain.

## License

MIT — fork it, self-host it, do whatever. If you ship a paid version, at least don't tell us.
