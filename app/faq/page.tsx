import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "How long previews last, what is logged, why logins behave oddly, how to fix a 502, the hourly limit, and how to report abuse.",
  alternates: { canonical: "https://dnspreviewer.com/faq" },
  openGraph: {
    title: "DNS Previewer: Frequently asked questions",
    description:
      "Everything worth knowing about the free DNS preview tool: expiration, logging, and troubleshooting.",
    url: "https://dnspreviewer.com/faq",
    type: "article",
  },
};

const faqs: Array<{ q: string; a: string; group: string }> = [
  {
    q: "Is this really free?",
    group: "Cost and limits",
    a: "Yes. Every feature is free, forever. No signup, no watermark, no 'pro' tier behind the most useful features.",
  },
  {
    q: "How long do previews last?",
    group: "Cost and limits",
    a: "15 minutes from creation. If you need more time, create a fresh preview, it takes a few seconds.",
  },
  {
    q: "Do you log my browsing?",
    group: "Privacy and abuse",
    a: "We count request hits per session for your own dashboard (so you can confirm your preview is being used). We don't log URLs, request bodies, or your IP beyond what's needed for rate limiting.",
  },
  {
    q: "Why is there a banner in the bottom-left of my preview?",
    group: "Using a preview",
    a: "So you always know you're looking at a DNS Previewer session and not your live site. It's dismissible with the × button, doesn't affect layout, and never appears on your actual domain.",
  },
  {
    q: "Can I hide the banner?",
    group: "Using a preview",
    a: "You can dismiss it per-page. For a permanently clean preview, self-host DNS Previewer, it is open source.",
  },
  {
    q: "Why do some links inside the preview go to my real domain?",
    group: "When something looks wrong",
    a: "We rewrite HTML and CSS URLs pointing at your exact domain. Subdomains (like cdn.example.com) and absolute JavaScript-built URLs aren't automatically rewritten — same behavior as every other preview proxy.",
  },
  {
    q: "Will logins / checkouts work?",
    group: "When something looks wrong",
    a: "Often yes, sometimes no. Cookies, OAuth redirects, and CSRF checks can be tied to the exact apex domain. Use the preview for visual + functional spot checks; don't expect full transactional flow unless your app is domain-agnostic.",
  },
  {
    q: "I'm seeing 502 / upstream error.",
    group: "When something looks wrong",
    a: "Your server didn't respond in time, isn't listening on the selected scheme, or is refusing non-matching SSL. Try the other scheme (HTTP vs HTTPS) or verify your server responds on the target IP.",
  },
  {
    q: "Why a 10-per-hour limit?",
    group: "Cost and limits",
    a: "To deter abuse. Someone could otherwise try to use this as an anonymizing proxy. 10 per hour is plenty for real migration work.",
  },
  {
    q: "Someone is abusing a preview. How do I report it?",
    group: "Privacy and abuse",
    a: "Visit /abuse or email abuse@dnspreviewer.com with the preview subdomain. We kill sessions fast.",
  },
];

/**
 * Schema.org FAQPage structured data. When Google parses this, the FAQs are
 * eligible to appear as an interactive accordion in the search result —
 * dramatically increasing CTR. Test with:
 *   https://search.google.com/test/rich-results?url=https://dnspreviewer.com/faq
 */
function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

const GROUP_ORDER = [
  "Cost and limits",
  "Using a preview",
  "When something looks wrong",
  "Privacy and abuse",
] as const;

export default function FAQPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-8 sm:py-14">
        <span className="chip">Help</span>
        <h1 className="heading mt-4 text-2xl sm:text-3xl md:text-4xl text-ink-900">
          Frequently asked questions
        </h1>
        {GROUP_ORDER.map((groupName) => (
          <section key={groupName} className="mt-8 sm:mt-10">
            <h2 className="heading text-lg sm:text-xl text-ink-900">{groupName}</h2>
            <div className="mt-4 space-y-3 sm:space-y-4">
              {faqs
                .filter((f) => f.group === groupName)
                .map((f) => (
                  <details key={f.q} className="card group">
                    <summary className="cursor-pointer flex items-start justify-between gap-3 list-none">
                      <h3 className="flex-1 font-display font-semibold text-ink-900 text-base">
                        {f.q}
                      </h3>
                      <span className="text-ink-400 group-open:rotate-45 transition-transform text-xl leading-none shrink-0">+</span>
                    </summary>
                    <p className="mt-3 text-sm sm:text-base text-ink-700 leading-relaxed">{f.a}</p>
                  </details>
                ))}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
      {/* JSON-LD for Google rich results — must be a literal <script> tag so
          search engine crawlers pick it up; Next.js's <Script> would defer it. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
    </>
  );
}
