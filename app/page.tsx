import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroPreviewForm } from "@/components/HeroPreviewForm";
import { currentUser } from "@/lib/auth";
import { ROOT_DOMAIN } from "@/lib/env";

/**
 * Schema.org JSON-LD for the homepage.
 *
 * Two entities in one @graph block so search engines have a clear picture
 * of what this site IS:
 *  1. WebSite — the site as a thing (canonical name, URL, publisher).
 *     Required to be eligible for the Sitelinks Search Box and other
 *     site-level rich features.
 *  2. SoftwareApplication — the product. The `offers.price = 0` field is
 *     specifically how Google understands "this is a free SaaS tool",
 *     making it eligible for free-product callouts.
 *
 * Test with: https://search.google.com/test/rich-results?url=https://dnspreviewer.com
 */
function homepageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://dnspreviewer.com/#website",
        url: "https://dnspreviewer.com/",
        name: "DNS Previewer",
        description:
          "Preview your website on a new server before switching DNS. 100% free — password protection, no-expiry links, wildcard support.",
        inLanguage: "en-US",
        publisher: { "@id": "https://dnspreviewer.com/#organization" },
      },
      {
        "@type": "Organization",
        "@id": "https://dnspreviewer.com/#organization",
        name: "DNS Previewer",
        url: "https://dnspreviewer.com/",
        logo: {
          "@type": "ImageObject",
          url: "https://dnspreviewer.com/apple-icon",
          width: 180,
          height: 180,
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://dnspreviewer.com/#software",
        name: "DNS Previewer",
        url: "https://dnspreviewer.com/",
        description:
          "Free tool to preview your website on a new server before switching DNS — wildcard subdomain reverse proxy with password protection, no-expiry links, and HTML/CSS URL rewriting.",
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "DNS / Web Hosting Migration",
        operatingSystem: "Any (web-based)",
        browserRequirements: "Modern browser with JavaScript enabled.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        },
        featureList: [
          "Wildcard subdomain previews",
          "Password-protected previews",
          "No-expiry links (signed-in users)",
          "Reverse proxy with HTML/CSS URL rewriting",
          "HTTPS, HTTP, or both with auto-fallback",
          "Free dashboard",
        ],
        creator: { "@id": "https://dnspreviewer.com/#organization" },
      },
    ],
  };
}

export default async function HomePage() {
  const user = await currentUser();
  return (
    <>
      <SiteHeader />
      <main>
        <Hero isLoggedIn={!!user} rootDomain={ROOT_DOMAIN} />
        <FreeVsPaid />
        <Steps />
        <Features />
        <BigCTA />
      </main>
      <SiteFooter />
      {/* JSON-LD for Google rich results — literal <script> so crawlers see
          it without waiting for hydration. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd()) }}
      />
    </>
  );
}

function Hero({ isLoggedIn, rootDomain }: { isLoggedIn: boolean; rootDomain: string }) {
  return (
    <section className="relative hero-glow">
      <div className="container-wide pt-10 pb-16 sm:pt-16 sm:pb-20 md:pt-24 md:pb-24 text-center">
        <div className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="chip-free">100% free forever</span>
          <span className="chip">No credit card</span>
        </div>
        <h1 className="heading mt-6 sm:mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight md:leading-[1.05] text-ink-900">
          Preview your website
          <br className="hidden md:block" />{" "}
          <span className="text-brand-500">before</span> switching DNS.
        </h1>
        <p className="mt-6 sm:mt-8 text-base sm:text-lg md:text-xl text-ink-700 max-w-2xl mx-auto leading-relaxed">
          Every feature our paid competitors lock up — password protection, no-expiry links,
          wildcard support, custom labels — <strong className="text-ink-900">free for everyone</strong>.
          No watermark, no signup wall, no nonsense.
        </p>

        <HeroPreviewForm isLoggedIn={isLoggedIn} rootDomain={rootDomain} />

        <p className="mt-6 text-sm text-ink-500">
          <Link
            href="/how-it-works"
            className="hover:text-brand-600 underline underline-offset-4 decoration-ink-200 hover:decoration-brand-300 transition"
          >
            How it works
          </Link>
          <span className="mx-2 text-ink-300">·</span>
          <Link
            href="/faq"
            className="hover:text-brand-600 underline underline-offset-4 decoration-ink-200 hover:decoration-brand-300 transition"
          >
            FAQ
          </Link>
        </p>
      </div>
    </section>
  );
}

function FreeVsPaid() {
  // Rows reflect what we've verified against paid alternatives in this space.
  // Specific competitor naming lives on /vs-skipdns; homepage stays generic.
  const rows: Array<{ feature: string; us: string; them: string }> = [
    { feature: "Monthly cost", us: "$0 — free, forever", them: "$9.9 – $159.9 / month" },
    { feature: "Preview links at once", us: "Unlimited", them: "3 – 300 depending on tier" },
    { feature: "Password-protected previews", us: "Included", them: "Higher tiers only" },
    { feature: "No-expiry links", us: "Included (free account)", them: "Paid — deleted if you cancel" },
    { feature: "Disable / re-enable a link", us: "Included", them: "Higher tiers only" },
    { feature: "Self-hosting option", us: "Coming (open source)", them: "Not offered" },
    { feature: "If you stop paying", us: "Nothing — it's free", them: "All your links deleted" },
  ];
  return (
    <section className="container-wide py-14 sm:py-20">
      <div className="text-center">
        <span className="chip">The difference</span>
        <h2 className="heading mt-4 text-2xl sm:text-3xl md:text-4xl text-ink-900">
          Everything others paywall — on us.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-ink-700 max-w-2xl mx-auto">
          DNS migration is infrastructure, not a luxury. We refuse to charge for basics.
        </p>
      </div>

      {/* Mobile: stacked card per feature */}
      <div className="mt-8 space-y-3 sm:hidden">
        {rows.map((r) => (
          <div key={r.feature} className="rounded-xl border border-ink-200 bg-white p-4 shadow-soft">
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
                  Paid competitors
                </div>
                <div className="mt-1 text-ink-500">{r.them}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* sm+: original table */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-soft hidden sm:block">
        <div className="grid grid-cols-12 bg-ink-50 text-sm font-semibold text-ink-700 border-b border-ink-200">
          <div className="col-span-6 px-5 py-4">Feature</div>
          <div className="col-span-3 px-5 py-4 text-brand-700">DNS Previewer</div>
          <div className="col-span-3 px-5 py-4 text-ink-500">Paid competitors</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.feature}
            className={`grid grid-cols-12 text-sm ${i % 2 === 0 ? "bg-white" : "bg-cream"}`}
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

      {/* CTA to the dedicated comparison page (high-intent SEO target) */}
      <div className="mt-6 sm:mt-8 text-center">
        <Link
          href="/vs-skipdns"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline underline-offset-4 transition"
        >
          See the full side-by-side comparison →
        </Link>
      </div>
    </section>
  );
}

function Check() {
  return (
    <span className="h-4 w-4 rounded-full bg-brand-500 text-white inline-flex items-center justify-center text-[10px] font-bold">
      ✓
    </span>
  );
}

function Steps() {
  const items = [
    {
      n: "1",
      title: "Enter your domain and new server",
      body: "example.com + 203.0.113.42. Label it, protect with a password, pick no-expiry — all optional.",
    },
    {
      n: "2",
      title: "We generate a private preview URL",
      body: "Something like x7k3p.dnspreviewer.com. Open it in any browser to hit your new server as if DNS had switched.",
    },
    {
      n: "3",
      title: "Test, fix, then flip DNS with confidence",
      body: "Verify the homepage, logins, forms — the whole thing. When it all works, update your DNS for real.",
    },
  ];
  return (
    <section className="bg-white border-y border-ink-200 py-14 sm:py-20">
      <div className="container-wide">
        <h2 className="heading text-2xl sm:text-3xl md:text-4xl text-center text-ink-900">
          Three steps. Under a minute.
        </h2>
        <div className="mt-10 sm:mt-12 grid md:grid-cols-3 gap-4 sm:gap-6">
          {items.map((it) => (
            <div key={it.n} className="card">
              <div className="h-10 w-10 rounded-xl bg-brand-500 text-white font-display font-bold text-lg inline-flex items-center justify-center shadow-glow">
                {it.n}
              </div>
              <h3 className="mt-5 font-display font-semibold text-lg tracking-tight">{it.title}</h3>
              <p className="mt-2 text-ink-700 leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: "🔒", title: "Password protect", body: "Share a preview only with stakeholders who have the password." },
    { icon: "♾️", title: "No-expiry links", body: "Sign in and create previews that live until you deactivate them." },
    { icon: "🌐", title: "Wildcard / multisite", body: "Preview a whole domain — subdomains included." },
    { icon: "🎯", title: "Specific subdomain", body: "Aim at blog.example.com or staging.example.com directly." },
    { icon: "⚡", title: "Flexible SSL", body: "HTTPS, HTTP, or auto-fallback. Your upstream cert doesn't have to match." },
    { icon: "🏷️", title: "Custom labels", body: "Give each preview a friendly name for your dashboard." },
    { icon: "📊", title: "Personal dashboard", body: "Sign up to track your active previews and hit counts." },
    { icon: "🚫", title: "No ads, ever", body: "We don't track you, and we don't clutter your preview with ads." },
  ];
  return (
    <section className="container-wide py-14 sm:py-20">
      <div className="text-center">
        <h2 className="heading text-2xl sm:text-3xl md:text-4xl text-ink-900">Every feature you&rsquo;ll need.</h2>
        <p className="mt-3 text-sm sm:text-base text-ink-700">Free. Forever. Really.</p>
      </div>
      <div className="mt-10 sm:mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((it) => (
          <div key={it.title} className="card hover:border-brand-200 transition">
            <div className="text-2xl">{it.icon}</div>
            <h3 className="mt-3 font-display font-semibold tracking-tight">{it.title}</h3>
            <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BigCTA() {
  return (
    <section className="container-wide py-14 sm:py-20">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 p-6 sm:p-10 md:p-16 text-white shadow-glow">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand-400/40 blur-3xl" />
        <div className="relative">
          <h2 className="heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl max-w-3xl leading-tight">
            Stop testing DNS migrations by refreshing and crossing your fingers.
          </h2>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-white/90 max-w-2xl">
            Create your first preview in under a minute. No credit card, no email required if you
            don&rsquo;t want one.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 sm:px-7 sm:py-3.5 font-semibold text-brand-700 hover:bg-cream transition"
            >
              Create a preview
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 sm:px-6 sm:py-3.5 font-medium text-white hover:bg-white/10 transition"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
