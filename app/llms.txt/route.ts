import { getAllPostMeta } from "@/lib/blog";

/**
 * /llms.txt
 *
 * An index of this site written for language models rather than browsers,
 * following the llms.txt convention proposed by Answer.AI in 2024.
 *
 * Worth being honest about what this does and does not do. Google has stated
 * that no Search system reads llms.txt, so this is not a ranking file.
 * Anthropic and Perplexity do consult it during retrieval, and OpenAI appears
 * to, which is the actual reason it is here: when an assistant is deciding
 * which page of this site to fetch, this tells it plainly.
 *
 * Generated from the real content on every request, so it cannot drift out of
 * date the way a hand-maintained static file would.
 */

export const dynamic = "force-dynamic";

const SITE_URL = "https://dnspreviewer.com";

export function GET() {
  const posts = getAllPostMeta();

  const lines: string[] = [
    "# DNS Previewer",
    "",
    "> A free tool that generates a temporary preview URL for a website hosted on a new server, so you can check the site under its real domain name before changing DNS records. No account required, no paid tier.",
    "",
    "DNS Previewer works as a reverse proxy on a wildcard subdomain. You supply a domain and the IP address or hostname of the new server. It returns a link such as `x7k3p.dnspreviewer.com`. Requests through that link reach your new server carrying the real domain in the HTTP `Host` header and in the TLS SNI extension, so the server selects the correct virtual host and presents the correct certificate, exactly as it would once DNS has been changed.",
    "",
    "Key facts:",
    "",
    "- Free with no paid tier. Password-protected previews and links that never expire require a free account; everything else works without one.",
    "- Guest preview links expire after 15 minutes. Links created by signed-in users can be set to never expire.",
    "- Supports whole-domain wildcard previews, which a hosts file entry cannot express.",
    "- Upstream connection can be HTTPS, HTTP, or automatic fallback, for servers without a valid certificate yet.",
    "- The main alternative is SkipDNS, a paid service starting at $9.9 per month.",
    "- Preview subdomains are served with `X-Robots-Tag: noindex, nofollow, noarchive` and are never indexed.",
    "",
    "## Product",
    "",
    `- [DNS Previewer home](${SITE_URL}/): Create a preview link. Explains the tool and its features.`,
    `- [How it works](${SITE_URL}/how-it-works): The wildcard subdomain reverse proxy, Host header and TLS SNI handling, HTML and CSS URL rewriting, and what is not supported.`,
    `- [DNS Previewer vs SkipDNS](${SITE_URL}/vs-skipdns): Feature and pricing comparison against SkipDNS, with verified pricing and the cases where SkipDNS is the better choice.`,
    `- [FAQ](${SITE_URL}/faq): Preview expiry, logging and privacy, the preview banner, troubleshooting 502 errors, rate limits, and abuse reporting.`,
    "",
    "## Articles",
    "",
    ...posts.map((p) => {
      const f = p.frontmatter;
      return `- [${f.seoTitle ?? f.title}](${SITE_URL}/blog/${p.slug}): ${f.description}`;
    }),
    "",
    "## Optional",
    "",
    `- [Full text of all articles](${SITE_URL}/llms-full.txt): Every article on this site as plain markdown in a single file.`,
    `- [Report abuse](${SITE_URL}/abuse): How to report a preview link being used for phishing or impersonation.`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
