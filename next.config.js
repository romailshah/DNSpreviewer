/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Produces a self-contained .next/standalone/ build with minimal node_modules,
  // which is what the Dockerfile copies into the final image.
  output: "standalone",
  // Critical for the proxy: upstream sites (esp. WordPress) use trailing-slash URLs
  // like /about/. We need Next to pass through to our handler without auto-stripping
  // the slash, otherwise we ping-pong with upstream's canonical redirect.
  skipTrailingSlashRedirect: true,
  // better-sqlite3 ships a native addon that Next's file-tracer can't follow;
  // treat it as an external so it's imported at runtime from node_modules instead.
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [
      {
        source: "/((?!api/proxy).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  // Google's favicon crawler still probes /favicon.ico first as a legacy
  // fallback. When that 404s, search results show a generic globe icon
  // (sometimes for weeks) before Google falls back to <link rel="icon">.
  // Rewrite to our programmatic /icon route — same bytes, correct path.
  // The Content-Type will be image/png (not image/x-icon) which every
  // modern crawler accepts.
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/icon" },
    ];
  },
};

module.exports = nextConfig;
