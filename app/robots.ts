import type { MetadataRoute } from "next";

const SITE_URL = "https://dnspreviewer.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Utility, auth, private, and proxy paths — all kept out of search.
        // Preview subdomains also send X-Robots-Tag: noindex via the proxy
        // route, so this is defense-in-depth, not the only line of defense.
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/login",
          "/signup",
          "/create",
          "/s/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
