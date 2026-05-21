import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Free skipdns.link alternative",
  description:
    "DNS Previewer is a free alternative to skipdns.link — same feature set (password-protected previews, no-expiry links, wildcard support) but every feature is free forever. Honest side-by-side comparison.",
  alternates: { canonical: "https://dnspreviewer.com/vs-skipdns" },
  openGraph: {
    title: "DNS Previewer — Free skipdns.link alternative",
    description:
      "Every feature skipdns.link paywalls, on us. Honest comparison: when to use DNS Previewer, when to stick with skipdns.",
    url: "https://dnspreviewer.com/vs-skipdns",
    type: "article",
  },
};

interface Row {
  feature: string;
  us: string;
  them: string;
  note?: string;
}

const rows: Row[] = [
  {
    feature: "Preview link generation",
    us: "Unlimited (free)",
    them: "Limited on free plan",
  },
  {
    feature: "Custom link label",
    us: "Included",
    them: "Paid add-on",
  },
  {
    feature: "Password-protected previews",
    us: "Included",
    them: "Paid plan only",
  },
  {
    feature: "No-expiry links",
    us: "Included (with free account)",
    them: "Paid plan only",
  },
  {
    feature: "Wildcard / multisite support",
    us: "Included",
    them: "Paid plan only",
  },
  {
    feature: "HTTP / HTTPS / auto-fallback",
    us: "All three included",
    them: "Limited",
  },
  {
    feature: "Personal dashboard",
    us: "Free account",
    them: "Paid account",
  },
  {
    feature: "Track preview hits",
    us: "Included",
    them: "Paid plan only",
  },
  {
    feature: "Self-hosting option",
    us: "Coming soon (open source)",
    them: "Not available",
  },
  {
    feature: "Ads / tracking on previews",
    us: "None",
    them: "Varies",
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
            DNS Previewer vs <span className="text-brand-500">skipdns.link</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ink-700 max-w-2xl mx-auto leading-relaxed">
            skipdns.link is a respected DNS preview tool, but every useful feature lives
            behind a paywall. <strong className="text-ink-900">DNS Previewer offers the
            same feature set free, forever</strong> — no signup wall, no watermark.
            Here&apos;s an honest side-by-side.
          </p>
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
                    <div className="mt-1 text-brand-700 font-semibold inline-flex items-center gap-1.5">
                      <Check /> {r.us}
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
              <div className="col-span-6 px-5 py-4">Feature</div>
              <div className="col-span-3 px-5 py-4 text-brand-700">DNS Previewer</div>
              <div className="col-span-3 px-5 py-4 text-ink-500">skipdns.link</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.feature}
                className={`grid grid-cols-12 text-sm ${
                  i % 2 === 0 ? "bg-white" : "bg-cream"
                }`}
              >
                <div className="col-span-6 px-5 py-4 text-ink-900">{r.feature}</div>
                <div className="col-span-3 px-5 py-4 text-brand-700 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <Check /> {r.us}
                  </span>
                </div>
                <div className="col-span-3 px-5 py-4 text-ink-500">{r.them}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Honest "when to pick each" section — credibility */}
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
                  <li>You want password protection, no-expiry, or wildcard without paying</li>
                  <li>You do migrations infrequently and don&apos;t need a subscription</li>
                  <li>You&apos;d prefer to self-host eventually (we&apos;re going open source)</li>
                  <li>You want a clean, ad-free preview experience</li>
                </ul>
              </div>
              <div className="card">
                <div className="text-2xl">🔗</div>
                <h3 className="mt-3 font-display font-semibold text-lg text-ink-900">
                  Stick with skipdns.link if&hellip;
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-700 list-disc pl-5">
                  <li>You already pay for it and the workflow works for you</li>
                  <li>You need a feature DNS Previewer doesn&apos;t support yet — tell us, we&apos;ll consider it</li>
                  <li>You prefer an established brand with longer track record</li>
                </ul>
              </div>
            </div>
            <p className="mt-8 text-sm text-ink-500 text-center max-w-xl mx-auto">
              We genuinely respect what skipdns.link built. We just believe DNS migration
              tooling shouldn&apos;t be locked behind a $19/month subscription when the
              underlying tech is straightforward to implement.
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
              Create your first preview in under a minute. Every feature unlocked.
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
    <span className="h-4 w-4 rounded-full bg-brand-500 text-white inline-flex items-center justify-center text-[10px] font-bold shrink-0">
      ✓
    </span>
  );
}
