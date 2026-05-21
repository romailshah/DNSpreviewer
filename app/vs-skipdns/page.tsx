import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Free skipdns.link alternative",
  description:
    "skipdns.link starts at $9.9/mo with no free tier. DNS Previewer offers the same core feature set — preview links, password protection, no-expiry — completely free, forever. Honest side-by-side comparison with verified pricing.",
  alternates: { canonical: "https://dnspreviewer.com/vs-skipdns" },
  openGraph: {
    title: "DNS Previewer — Free skipdns.link alternative",
    description:
      "skipdns.link starts at $9.9/mo. DNS Previewer is free. Honest comparison of features, pricing, and limitations.",
    url: "https://dnspreviewer.com/vs-skipdns",
    type: "article",
  },
};

interface Row {
  feature: string;
  us: string;
  them: string;
}

// Comparison rows reflect only what's verifiable from skipdns.link's
// public pricing page as of May 2026. Anything not visible there has
// been omitted rather than guessed.
const rows: Row[] = [
  {
    feature: "Monthly cost",
    us: "$0 — free forever",
    them: "$9.9 – $159.9/mo (no free tier)",
  },
  {
    feature: "Preview links you can have at once",
    us: "Unlimited",
    them: "3 – 300 depending on tier",
  },
  {
    feature: "Password-protected previews",
    us: "Included",
    them: "Agency tier only ($39.9/mo)",
  },
  {
    feature: "Disable / re-enable a preview link",
    us: "Included",
    them: "Developer tier or higher ($19.9/mo)",
  },
  {
    feature: "No-expiry links (signed-in users)",
    us: "Included",
    them: "All paying tiers — links deleted on cancellation",
  },
  {
    feature: "API access",
    us: "Not available yet",
    them: "Enterprise tier or higher ($79.9/mo)",
  },
  {
    feature: "Self-hosting",
    us: "Coming soon (open source)",
    them: "Not offered",
  },
  {
    feature: "What happens if you stop paying",
    us: "Nothing — it's free",
    them: "All your links are deleted",
  },
];

export default function VsSkipDnsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="container-narrow pt-10 pb-8 sm:pt-16 sm:pb-12 text-center">
          <span className="chip-free">100% free alternative</span>
          <h1 className="heading mt-5 text-3xl sm:text-4xl md:text-5xl text-ink-900 leading-tight">
            DNS Previewer vs{" "}
            <span className="text-brand-500">skipdns.link</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ink-700 max-w-2xl mx-auto leading-relaxed">
            skipdns.link is a respected DNS preview tool, but it starts at{" "}
            <strong className="text-ink-900">$9.9/mo</strong> with no free
            tier — and your links are deleted if you ever cancel.{" "}
            <strong className="text-ink-900">
              DNS Previewer is free, forever
            </strong>{" "}
            with no signup wall and no lock-in.
          </p>
        </section>

        {/* Quick pricing-at-a-glance — high impact */}
        <section className="container-narrow pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card border-brand-200 bg-brand-50/40 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                DNS Previewer
              </div>
              <div className="mt-2 font-display font-extrabold text-4xl sm:text-5xl text-brand-700">
                $0
              </div>
              <div className="text-sm text-ink-700 mt-1">Free, forever</div>
            </div>
            <div className="card text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
                skipdns.link
              </div>
              <div className="mt-2 font-display font-extrabold text-4xl sm:text-5xl text-ink-700">
                $9.9–$159.9
              </div>
              <div className="text-sm text-ink-500 mt-1">
                /mo · 5 paid tiers · no free option
              </div>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="container-wide pb-14 sm:pb-20">
          {/* Mobile: stacked cards */}
          <div className="space-y-3 sm:hidden">
            {rows.map((r) => (
              <div
                key={r.feature}
                className="rounded-xl border border-ink-200 bg-white p-4 shadow-soft"
              >
                <div className="font-semibold text-ink-900">{r.feature}</div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                      DNS Previewer
                    </div>
                    <div className="mt-1 text-brand-700 font-semibold inline-flex items-start gap-1.5">
                      <Check /> <span>{r.us}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
                      skipdns.link
                    </div>
                    <div className="mt-1 text-ink-500">{r.them}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* sm+: table */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-soft max-w-4xl mx-auto">
            <div className="grid grid-cols-12 bg-ink-50 text-sm font-semibold text-ink-700 border-b border-ink-200">
              <div className="col-span-5 px-5 py-4">Feature</div>
              <div className="col-span-4 px-5 py-4 text-brand-700">
                DNS Previewer
              </div>
              <div className="col-span-3 px-5 py-4 text-ink-500">skipdns.link</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.feature}
                className={`grid grid-cols-12 text-sm ${
                  i % 2 === 0 ? "bg-white" : "bg-cream"
                }`}
              >
                <div className="col-span-5 px-5 py-4 text-ink-900">
                  {r.feature}
                </div>
                <div className="col-span-4 px-5 py-4 text-brand-700 font-semibold">
                  <span className="inline-flex items-start gap-1.5">
                    <Check /> <span>{r.us}</span>
                  </span>
                </div>
                <div className="col-span-3 px-5 py-4 text-ink-500">{r.them}</div>
              </div>
            ))}
          </div>

          {/* Source-of-truth note */}
          <p className="mt-5 text-xs text-ink-500 text-center max-w-2xl mx-auto">
            skipdns.link pricing and feature data from their public pricing
            page (as of May 2026). Anything not advertised there is omitted
            here rather than guessed. If anything has changed,{" "}
            <a
              href="mailto:hello@dnspreviewer.com"
              className="text-brand-600 hover:underline"
            >
              let us know
            </a>{" "}
            and we&apos;ll update.
          </p>
        </section>

        {/* Honest "when to pick each" — credibility */}
        <section className="bg-white border-y border-ink-200 py-14 sm:py-20">
          <div className="container-narrow">
            <h2 className="heading text-2xl sm:text-3xl text-ink-900 text-center">
              When to pick each tool
            </h2>
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="card border-brand-200">
                <div className="text-2xl">👁️</div>
                <h3 className="mt-3 font-display font-semibold text-lg text-ink-900">
                  Pick DNS Previewer if&hellip;
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-700 list-disc pl-5">
                  <li>You want password-protected previews without paying $39.9/mo</li>
                  <li>You do migrations infrequently and don&apos;t want a subscription you&apos;ll forget to cancel</li>
                  <li>You don&apos;t want to lose your saved links if you ever stop paying</li>
                  <li>You&apos;d prefer to self-host eventually (we&apos;re going open source)</li>
                  <li>You want unlimited preview links</li>
                </ul>
              </div>
              <div className="card">
                <div className="text-2xl">🔗</div>
                <h3 className="mt-3 font-display font-semibold text-lg text-ink-900">
                  Stick with skipdns.link if&hellip;
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-700 list-disc pl-5">
                  <li>You need a public API to automate link management — they have one ($79.9/mo+)</li>
                  <li>You already pay for it and the workflow works for you</li>
                  <li>You prefer an established brand with a longer track record</li>
                  <li>You need a feature DNS Previewer doesn&apos;t support yet — tell us, we&apos;ll consider it</li>
                </ul>
              </div>
            </div>
            <p className="mt-8 text-sm text-ink-500 text-center max-w-xl mx-auto">
              We genuinely respect what skipdns.link built — DNS migration
              preview is a real category of tool. We just believe the core
              workflow shouldn&apos;t cost $9.9–$159.9 a month when the
              underlying tech is reasonably straightforward to implement.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="container-wide py-14 sm:py-20">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 p-8 sm:p-12 md:p-16 text-white shadow-glow text-center">
            <h2 className="heading text-2xl sm:text-3xl md:text-4xl leading-tight max-w-2xl mx-auto">
              Try DNS Previewer free. No card, no signup wall.
            </h2>
            <p className="mt-4 text-white/90 max-w-xl mx-auto">
              Create your first preview in under a minute. Every feature
              unlocked, no subscription required.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 sm:px-7 sm:py-3.5 font-semibold text-brand-700 hover:bg-cream transition"
              >
                Start a free preview
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 sm:px-6 sm:py-3.5 font-medium text-white hover:bg-white/10 transition"
              >
                How it works
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Check() {
  return (
    <span className="h-4 w-4 mt-0.5 rounded-full bg-brand-500 text-white inline-flex items-center justify-center text-[10px] font-bold shrink-0">
      ✓
    </span>
  );
}
