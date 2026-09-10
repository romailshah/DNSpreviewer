import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";

/**
 * /llms-full.txt
 *
 * Every article on the site as one plain markdown document, which is the
 * companion convention to /llms.txt. An assistant that wants the substance
 * rather than the navigation can fetch this one URL instead of crawling and
 * stripping HTML from each post in turn.
 *
 * Markdown source is served rather than rendered HTML deliberately: the
 * source is already clean, has no navigation chrome to strip, and preserves
 * the code blocks and tables that carry most of the technical detail.
 */

export const dynamic = "force-dynamic";

const SITE_URL = "https://dnspreviewer.com";

export function GET() {
  const slugs = getAllPostSlugs();

  const parts: string[] = [
    "# DNS Previewer articles",
    "",
    "Full text of every article published on dnspreviewer.com. DNS Previewer is a free tool that generates a temporary preview URL for a website on a new server, so it can be checked under its real domain before DNS is changed.",
    "",
    `Source: ${SITE_URL}`,
    `Retrieved: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "---",
    "",
  ];

  for (const slug of slugs) {
    const post = getPostBySlug(slug);
    if (!post) continue;
    const f = post.frontmatter;

    parts.push(
      `# ${f.seoTitle ?? f.title}`,
      "",
      `URL: ${SITE_URL}/blog/${slug}`,
      `Published: ${f.publishedAt}${f.updatedAt ? ` (updated ${f.updatedAt})` : ""}`,
      `Author: ${f.author}`,
      "",
      post.content.trim(),
      "",
    );

    if (f.faqs?.length) {
      parts.push("## Frequently asked questions", "");
      for (const faq of f.faqs) {
        parts.push(`**${faq.q}**`, "", faq.a, "");
      }
    }

    parts.push("---", "");
  }

  return new Response(parts.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
