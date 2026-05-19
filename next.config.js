/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
};

module.exports = nextConfig;
