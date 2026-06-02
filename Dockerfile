# syntax=docker/dockerfile:1.7

# ─── deps ────────────────────────────────────────────────────────────────────
# Install ALL dependencies (incl. devDeps) so Next.js can build.
# Native modules (better-sqlite3) need python/make/g++ to compile.
FROM node:22-alpine AS deps
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev


# ─── builder ─────────────────────────────────────────────────────────────────
# Build the Next.js app with `output: 'standalone'`. Produces .next/standalone/
# which contains a self-contained Node server + minimal node_modules.
FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ─── runner ──────────────────────────────────────────────────────────────────
# Slim production image. Only ships the built standalone server + static assets
# + the native better-sqlite3 module (rebuilt against alpine's musl libc).
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user for the runtime process
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Standalone server bundle (server.js + bare-minimum node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Public assets (favicon, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Static chunks (CSS, JS, images served from /_next/static)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Markdown blog content — /blog and /blog/[slug] read these files at request
# time via fs.readFileSync. Next.js's standalone tracer doesn't see fs paths
# constructed from process.cwd(), so we copy them in by hand.
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

# better-sqlite3 is marked as a server-external package, so Next's tracer
# leaves it out of standalone/node_modules. Copy it (and its tiny dependency
# `bindings`) in by hand so `require("better-sqlite3")` resolves at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bindings        ./node_modules/bindings
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

# Create the /data mount point ahead of time so the fly.toml volume mount
# never lands on a missing directory.
RUN mkdir -p /data && chown -R nextjs:nodejs /data

USER nextjs

EXPOSE 3000

# next.js standalone output uses `server.js` as the entrypoint
CMD ["node", "server.js"]
