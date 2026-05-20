import type { MetadataRoute } from "next";

const SITE_URL = "https://dnspreviewer.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Utility / auth / private / proxy paths — kept out of search.
        // Preview subdomains also send X-Robots-Tag: noindex via the proxy
        // route, so this is defense-in-depth, not the only line of defense.
        //
        // NOTE: /signup is intentionally NOT disallowed here — it's a real
        // acquisition landing page that should be crawlable + indexable.
        // It has unique SEO metadata, lives in sitemap.xml, and queries like
        // "DNS Previewer signup" should be able to find it. Login/create are
        // utility pages with no unique searchable content, so they stay
        // blocked.
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/login",
          "/create",
          "/s/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
