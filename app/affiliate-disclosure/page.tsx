import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Affiliate disclosure",
  description: "How DNS Previewer uses affiliate links, and what that means for you.",
  alternates: { canonical: "https://dnspreviewer.com/affiliate-disclosure" },
};

export default function AffiliateDisclosurePage() {
  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-8 sm:py-14">
        <span className="chip">Disclosure</span>
        <h1 className="heading mt-4 text-2xl sm:text-3xl md:text-4xl text-ink-900">Affiliate disclosure</h1>
        <div className="mt-6 space-y-4 text-sm sm:text-base text-ink-700 leading-relaxed">
          <p>
            DNS Previewer is free, and it stays free. To help pay for running it, some pages include
            affiliate links. If you buy something through one of them, I earn a commission. It costs you
            nothing extra.
          </p>
          <p>
            At the moment the only affiliate link on the site is for Hostinger&reg; hosting. I&rsquo;m an
            affiliate, not an official partner, and Hostinger doesn&rsquo;t review or approve anything I
            write. I recommend it because it&rsquo;s what I use for my own client sites.
          </p>
          <p>
            The Hostinger link goes through <code>dnspreviewer.com/go/hostinger</code>, which forwards you
            to Hostinger with my affiliate tracking attached. Routing it this way lets me keep the link up to
            date in one place, and it&rsquo;s marked as sponsored for search engines. The preview tool itself
            never shows affiliate links or ads inside your preview.
          </p>
          <p>
            Questions about any of this? Use the Help &amp; feedback button, or go back to the{" "}
            <Link href="/" className="text-brand-600 hover:underline">
              homepage
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
