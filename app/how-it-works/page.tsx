import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How DNS Previewer works",
  description:
    "How DNS Previewer lets you test a website on a new server before flipping DNS — wildcard subdomains, reverse proxy, HTML/CSS URL rewriting, password protection, and what's supported vs not.",
  alternates: { canonical: "https://dnspreviewer.com/how-it-works" },
  openGraph: {
    title: "How DNS Previewer works",
    description:
      "Test a website on a new server before flipping DNS — how the wildcard subdomain proxy works under the hood.",
    url: "https://dnspreviewer.com/how-it-works",
    type: "article",
  },
};

/**
 * Schema.org HowTo for the "how to preview a site before DNS switch" flow.
 *
 * Eligible for Google's HowTo rich result (a numbered-steps block right in
 * the SERP) when the user-facing copy on the page mirrors the schema's
 * step list. We keep the wording aligned with the on-page <ol> below.
 *
 * Test with: https://search.google.com/test/rich-results?url=https://dnspreviewer.com/how-it-works
 */
function howToJsonLd() {
  const base = "https://dnspreviewer.com/how-it-works";
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to preview a website on a new server before switching DNS",
    description:
      "Test a website running on a new server before pointing your domain at it — using a wildcard subdomain reverse proxy that streams your target server back to your browser under a temporary URL.",
    totalTime: "PT1M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: "0",
    },
    supply: [
      { "@type": "HowToSupply", name: "The domain you're migrating (e.g. example.com)" },
      { "@type": "HowToSupply", name: "The new server's IP or hostname" },
    ],
    tool: [{ "@type": "HowToTool", name: "DNS Previewer (web-based, free)" }],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Provide your domain and the new server",
        text: "Enter the domain you're migrating (e.g. example.com) and the new server's IP or hostname. DNS Previewer's hero form on the homepage handles this in one step.",
        url: `${base}#step-1`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Receive a private preview subdomain",
        text: "A short subdomain like a7xk2p.dnspreviewer.com is generated. Behind the scenes, a reverse proxy is opened that fetches your target server with the correct Host header and TLS SNI for your domain.",
        url: `${base}#step-2`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Browse the preview to verify the migration",
        text: "Open the preview URL in any browser. Your new server responds as if DNS had already been switched. Internal links and CSS URLs pointing at your domain are auto-rewritten to keep working inside the preview. When you're confident, flip DNS for real.",
        url: `${base}#step-3`,
      },
    ],
  };
}

export default function HowItWorks() {
  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-8 sm:py-14">
        <span className="chip">How it works</span>
        <h1 className="heading mt-4 text-2xl sm:text-3xl md:text-4xl text-ink-900">
          How DNS Previewer works
        </h1>
        <p className="mt-4 text-sm sm:text-base text-ink-700 leading-relaxed">
          When you migrate a site to a new host, your domain still points to the old server until
          you update DNS. That&rsquo;s a problem: you can&rsquo;t easily test the new host under its
          real domain, and a botched switchover is visible to every visitor.
        </p>

        <h2 className="heading mt-8 sm:mt-10 text-lg sm:text-xl md:text-2xl text-ink-900">The standard workarounds — and why they hurt</h2>
        <ul className="mt-3 list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-ink-700 leading-relaxed">
          <li><strong className="text-ink-900">Editing /etc/hosts:</strong> only works on your machine. Can&rsquo;t share with clients or QA.</li>
          <li><strong className="text-ink-900">Using the server&rsquo;s IP directly:</strong> wrong Host header, SSL cert errors, broken vhosts.</li>
          <li><strong className="text-ink-900">Staging subdomain:</strong> often has a different code path than production, so issues slip through.</li>
        </ul>

        <h2 className="heading mt-8 sm:mt-10 text-lg sm:text-xl md:text-2xl text-ink-900">What DNS Previewer does</h2>
        <ol className="mt-3 list-decimal pl-5 sm:pl-6 space-y-3 text-sm sm:text-base text-ink-700 leading-relaxed">
          <li>
            You tell us your domain (<code>example.com</code>) and the new server&rsquo;s IP or hostname.
          </li>
          <li>
            We generate a short subdomain like <code>a7xk2p.dnspreviewer.com</code> and open a
            reverse proxy on it.
          </li>
          <li>
            When you visit that URL, our proxy connects to your target server using the correct{" "}
            <code>Host</code> header and TLS SNI for your domain — so your server serves the right
            vhost and content.
          </li>
          <li>
            Responses are streamed back to your browser. HTML and CSS that reference your domain
            are rewritten to the preview URL so clicks and assets keep working inside the preview.
          </li>
          <li>
            After 15 minutes the session expires and the URL returns a friendly expired page.
          </li>
        </ol>

        <h2 className="heading mt-8 sm:mt-10 text-lg sm:text-xl md:text-2xl text-ink-900">What&rsquo;s stripped or rewritten</h2>
        <ul className="mt-3 list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-ink-700 leading-relaxed break-words">
          <li><code>X-Frame-Options</code>, <code>Content-Security-Policy</code>, and <code>Strict-Transport-Security</code> headers are removed so the preview can load.</li>
          <li><code>Set-Cookie</code> domain attributes are removed so cookies bind to the preview subdomain.</li>
          <li><code>Location</code> redirects to your domain are rewritten to stay inside the preview.</li>
          <li>Response bodies are decompressed before rewriting (we ask upstream for identity encoding).</li>
        </ul>

        <h2 className="heading mt-8 sm:mt-10 text-lg sm:text-xl md:text-2xl text-ink-900">Known limitations</h2>
        <ul className="mt-3 list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-ink-700 leading-relaxed break-words">
          <li>JavaScript that hardcodes your apex domain in <code>fetch()</code>/<code>XMLHttpRequest</code> will hit CORS errors. This is inherent to any preview proxy.</li>
          <li>WebSockets are not proxied. Most apps fall back to long polling.</li>
          <li>Responses larger than 4&nbsp;MB pass through without link rewriting.</li>
          <li>Third-party services (OAuth, payment gateways) may not accept requests that originated from a subdomain they don&rsquo;t recognize.</li>
        </ul>

        <p className="mt-8 sm:mt-10">
          <Link href="/create" className="btn-primary">Try it now</Link>
        </p>
      </main>
      <SiteFooter />
      {/* JSON-LD HowTo schema for Google rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd()) }}
      />
    </>
  );
}
