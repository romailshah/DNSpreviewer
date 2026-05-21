import type { MetadataRoute } from "next";

const SITE_URL = "https://dnspreviewer.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // Use the build/deploy timestamp as a sensible "last modified" for now.
  // When we add a blog or other content sources, swap this for per-page mtime.
  const now = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      // High-intent comparison page targeting "skipdns alternative" keyword.
      // Priority 0.9 because this is one of our strongest acquisition pages.
      url: `${SITE_URL}/vs-skipdns`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/abuse`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
