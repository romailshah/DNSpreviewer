import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Free SkipDNS Alternative for Previewing a Site Before DNS",
  description:
    "SkipDNS costs $9.9 to $159.9 a month with no permanently free plan, and deletes your links when you cancel. DNS Previewer does the same job for free. Verified pricing comparison, updated September 2026.",
  alternates: { canonical: "https://dnspreviewer.com/vs-skipdns" },
  openGraph: {
    title: "Free SkipDNS Alternative for Previewing a Site Before DNS",
    description:
      "SkipDNS starts at $9.9 a month and deletes your links if you cancel. DNS Previewer is free. Verified side by side comparison.",
    url: "https://dnspreviewer.com/vs-skipdns",
    type: "article",
  },
};

interface Row {
  feature: string;
  us: string;
  them: string;
  /** true when SkipDNS matches or beats us, so the row reads honestly */
  evenOrBetter?: boolean;
}

// Every figure below was read off skipdns.link/pricing on 7 September 2026.
// Nothing here is inferred. If a cell cannot be verified on their public
// pricing page it is left out rather than guessed at.
const rows: Row[] = [
  {
    feature: "Price",
    us: "Free, no card",
    them: "$9.9 to $159.9 a month",
  },
  {
    feature: "Free option",
    us: "Free permanently",
    them: "3 to 30 day trial, then paid",
  },
  {
    feature: "Preview links at once",
    us: "Unlimited",
    them: "3 on the $9.9 plan, up to 300 on the $159.9 plan",
  },
  {
    feature: "Password on a preview",
    us: "Included",
    them: "Included on every plan",
    evenOrBetter: true,
  },
  {
    feature: "Turn a link on or off",
    us: "Included",
    them: "Included on every plan",
    evenOrBetter: true,
  },
  {
    feature: "Links that never expire",
    us: "Included with a free account",
    them: "Included while your subscription is active",
  },
  {
    feature: "API",
    us: "Not available",
    them: "Included on every plan",
    evenOrBetter: true,
  },
  {
    feature: "Self-hosting",
    us: "Yes, the source is on GitHub",
    them: "Not offered",
  },
  {
    feature: "If you stop paying",
    us: "Nothing changes, it stays free",
    them: "Your links are deleted",
  },
];

const faqs = [
  {
    q: "How much does SkipDNS cost?",
    a: "SkipDNS has five paid plans, billed monthly: Hobbyist at $9.9, Developer at $19.9, Agency at $39.9, Enterprise at $79.9 and Partner at $159.9. Paying yearly gives you two months free. The plans differ mainly in how many preview links you can hold at once, from 3 on Hobbyist to 300 on Partner. Prices checked on 7 September 2026.",
  },
  {
    q: "Does SkipDNS have a free plan?",
    a: "No. Every SkipDNS plan is paid. Each one starts with a free trial, lasting 3 days on Hobbyist, 10 days on Developer and 30 days on the Agency, Enterprise and Partner plans. Once the trial ends you need a subscription to keep using it.",
  },
  {
    q: "Is there a free SkipDNS alternative?",
    a: "Yes. DNS Previewer does the same job at no cost. You give it a domain and the IP address of the new server, and it returns a preview link on a subdomain such as x7k3p.dnspreviewer.com that loads your site from the new server as though DNS had already changed. There is no card, no trial clock and no paid tier.",
  },
  {
    q: "What happens to my SkipDNS links if I cancel?",
    a: "SkipDNS deletes every link in your account when a plan expires. You keep access to the dashboard and can subscribe again, but the links themselves are gone. DNS Previewer links stay live because there is no subscription to lapse.",
  },
  {
    q: "Does DNS Previewer have an API?",
    a: "Not yet. SkipDNS includes full API access on all five of its plans, so if you need to create preview links from a script or a deployment pipeline, SkipDNS is the better fit today.",
  },
  {
    q: "Can I self-host DNS Previewer?",
    a: "Yes. The source is public on GitHub and the repository includes a deployment guide covering the server, DNS and the wildcard TLS certificate that preview subdomains need. SkipDNS is a hosted service only.",
  },
];

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export default function VsSkipDnsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="container-narrow pt-10 pb-8 sm:pt-16 sm:pb-12 text-center">
          <span className="chip-free">Free, no trial clock</span>
          <h1 className="heading mt-5 text-3xl sm:text-4xl md:text-5xl text-ink-900 leading-tight">
            A free <span className="text-brand-500">SkipDNS alternative</span>{" "}
            for previewing a site before you switch DNS
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ink-700 max-w-2xl mx-auto leading-relaxed">
            SkipDNS has been doing this since 2017 and it works well. It also
            costs between $9.9 and $159.9 a month, caps how many preview links
            you can keep, and deletes all of them if you ever stop paying. DNS
            Previewer does the same job for nothing, with no link cap and no
            subscription to forget about.
          </p>
        </section>

        {/* Pricing at a glance */}
        <section className="container-narrow pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card border-brand-200 bg-brand-50/40 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                DNS Previewer
              </div>
              <div className="mt-2 font-display font-extrabold text-4xl sm:text-5xl text-brand-700">
                $0
              </div>
              <div className="text-sm text-ink-700 mt-1">
                Unlimited links, no card
              </div>
            </div>
            <div className="card text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
                SkipDNS
              </div>
              <div className="mt-2 font-display font-extrabold text-4xl sm:text-5xl text-ink-700">
                $9.9 to $159.9
              </div>
              <div className="text-sm text-ink-500 mt-1">
                a month, 5 plans, 3 to 300 links
              </div>
            </div>
          </div>
        </section>

        {/* What SkipDNS actually charges for */}
        <section className="container-narrow pb-12">
          <h2 className="heading text-2xl sm:text-3xl text-ink-900">
            What SkipDNS charges for in 2026
          </h2>
          <p className="mt-4 text-ink-700 leading-relaxed">
            SkipDNS used to keep link passwords and API access on its higher
            plans. That is no longer true, and we would rather correct our own
            page than leave a stale comparison sitting here. As of September
            2026 all five plans include link passwords, the ability to switch a
            link on and off, and full API access. What separates the plans now
            is how many preview links you can hold at once and how long the free
            trial runs.
          </p>
          <p className="mt-4 text-ink-700 leading-relaxed">
            Hobbyist is $9.9 a month for 3 link slots and a 3 day trial.
            Developer is $19.9 for 10 slots, Agency is $39.9 for 30, Enterprise
            is $79.9 for 100, and Partner is $159.9 for 300. Paying for a year
            gets you two months free. No plan is permanently free.
          </p>
          <p className="mt-4 text-ink-700 leading-relaxed">
            One line in their FAQ matters more than the price for most people.
            When a plan expires, every link in the account is deleted. If you
            handed a client a preview link and your card fails three months
            later, that link stops working.
          </p>
        </section>

        {/* Comparison table */}
        <section className="container-wide pb-14 sm:pb-20">
          <h2 className="heading text-2xl sm:text-3xl text-ink-900 text-center mb-8">
            DNS Previewer and SkipDNS side by side
          </h2>

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
                      {!r.evenOrBetter && <Check />} <span>{r.us}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
                      SkipDNS
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
              <div className="col-span-4 px-5 py-4">Feature</div>
              <div className="col-span-4 px-5 py-4 text-brand-700">
                DNS Previewer
              </div>
              <div className="col-span-4 px-5 py-4 text-ink-500">SkipDNS</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.feature}
                className={`grid grid-cols-12 text-sm ${
                  i % 2 === 0 ? "bg-white" : "bg-cream"
                }`}
              >
                <div className="col-span-4 px-5 py-4 text-ink-900">
                  {r.feature}
                </div>
                <div className="col-span-4 px-5 py-4 text-brand-700 font-semibold">
                  <span className="inline-flex items-start gap-1.5">
                    {!r.evenOrBetter && <Check />} <span>{r.us}</span>
                  </span>
                </div>
                <div className="col-span-4 px-5 py-4 text-ink-500">{r.them}</div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-ink-500 text-center max-w-2xl mx-auto">
            SkipDNS figures read directly from skipdns.link/pricing on 7
            September 2026. Anything their pricing page does not state is left
            out here rather than guessed at. If something has changed,{" "}
            <a
              href="mailto:hello@dnspreviewer.com"
              className="text-brand-600 hover:underline"
            >
              tell us
            </a>{" "}
            and we will fix it.
          </p>
        </section>

        {/* Honest recommendation */}
        <section className="bg-white border-y border-ink-200 py-14 sm:py-20">
          <div className="container-narrow">
            <h2 className="heading text-2xl sm:text-3xl text-ink-900 text-center">
              Which one should you use
            </h2>
            <div className="mt-10 grid md:grid-cols-2 gap-6">
              <div className="card border-brand-200">
                <h3 className="font-display font-semibold text-lg text-ink-900">
                  DNS Previewer suits you if
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-700 list-disc pl-5">
                  <li>
                    You migrate sites now and then, and you do not want a
                    monthly charge sitting there between jobs
                  </li>
                  <li>
                    Three link slots is not enough, and $39.9 a month for thirty
                    of them is more than the work is worth
                  </li>
                  <li>
                    You have handed a client a preview link that needs to still
                    work next year
                  </li>
                  <li>You would rather run it on your own server</li>
                </ul>
              </div>
              <div className="card">
                <h3 className="font-display font-semibold text-lg text-ink-900">
                  SkipDNS suits you if
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-ink-700 list-disc pl-5">
                  <li>
                    You need an API. Theirs is on every plan and we do not have
                    one yet, which is the clearest reason to pick them
                  </li>
                  <li>
                    You want a service that has been running since 2017, with
                    hosting providers vouching for it publicly
                  </li>
                  <li>You already pay for it and your workflow is settled</li>
                </ul>
              </div>
            </div>
            <p className="mt-8 text-sm text-ink-500 text-center max-w-xl mx-auto">
              We are not pretending SkipDNS is a bad tool. It is a good one, and
              it created this category. We just think checking a site before you
              point DNS at it is basic plumbing, and basic plumbing should not
              carry a subscription.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="container-narrow py-14 sm:py-20">
          <h2 className="heading text-2xl sm:text-3xl text-ink-900 text-center">
            Common questions about SkipDNS and the alternatives
          </h2>
          <div className="mt-10 space-y-6 max-w-3xl mx-auto">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-display font-semibold text-lg text-ink-900">
                  {f.q}
                </h3>
                <p className="mt-2 text-ink-700 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container-wide pb-14 sm:pb-20">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 p-8 sm:p-12 md:p-16 text-white shadow-glow text-center">
            <h2 className="heading text-2xl sm:text-3xl md:text-4xl leading-tight max-w-2xl mx-auto">
              Try it on your next migration
            </h2>
            <p className="mt-4 text-white/90 max-w-xl mx-auto">
              Enter a domain and the new server IP, and you will have a working
              preview link in under a minute. No card, no trial countdown.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 sm:px-7 sm:py-3.5 font-semibold text-brand-700 hover:bg-cream transition"
              >
                Create a free preview
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
      {/* JSON-LD for Google rich results. Must be a literal <script> tag so
          crawlers pick it up; Next.js's <Script> would defer it. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
    </>
  );
}

function Check() {
  return (
    <span className="h-4 w-4 mt-0.5 rounded-full bg-brand-500 text-white inline-flex items-center justify-center text-[10px] font-bold shrink-0">
      &#10003;
    </span>
  );
}
