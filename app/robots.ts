import type { MetadataRoute } from "next";

const SITE_URL = "https://dnspreviewer.com";

/**
 * Utility, auth, private and proxy paths kept out of every crawler's index.
 *
 * Preview subdomains additionally send X-Robots-Tag: noindex, nofollow,
 * noarchive from the proxy route, so this is defence in depth rather than the
 * only line of defence.
 *
 * /signup is intentionally absent from this list. It is a real acquisition
 * landing page with its own metadata, and queries like "DNS Previewer signup"
 * should be able to reach it. Login and create are utility pages with no
 * unique searchable content, so they stay blocked.
 */
const DISALLOW = ["/admin", "/admin/", "/api/", "/dashboard", "/login", "/create", "/s/"];

/**
 * Assistant and AI training crawlers, listed explicitly.
 *
 * The wildcard rule below already permits all of them, so this changes no
 * behaviour today. It is here because a named block is unambiguous: a crawler
 * that finds its own user agent uses that block and ignores the wildcard, so
 * stating the position explicitly means a later edit to the wildcard cannot
 * silently change what assistants are allowed to read.
 *
 * The decision itself is deliberate. Being quotable by assistants is worth
 * more to a free tool than withholding the content would be, and every path
 * listed here is public anyway.
 *
 * If that calculation ever changes, one of these is the single place to flip.
 */
const AI_CRAWLERS = [
  "GPTBot", // OpenAI, training
  "OAI-SearchBot", // OpenAI, ChatGPT search results
  "ChatGPT-User", // OpenAI, user-initiated fetches
  "ClaudeBot", // Anthropic, training
  "Claude-User", // Anthropic, user-initiated fetches
  "Claude-SearchBot", // Anthropic, search indexing
  "PerplexityBot", // Perplexity, indexing
  "Perplexity-User", // Perplexity, user-initiated fetches
  "Google-Extended", // Google, Gemini grounding and training
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl, feeds many training sets
  "meta-externalagent", // Meta AI
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
