import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report abuse",
  description:
    "Report a DNS Previewer preview being used for phishing, impersonation, or abuse. We respond fast and kill sessions on confirmed reports.",
  alternates: { canonical: "https://dnspreviewer.com/abuse" },
  openGraph: {
    title: "DNS Previewer — Report abuse",
    description: "Report a preview being misused. We take action fast.",
    url: "https://dnspreviewer.com/abuse",
    type: "article",
  },
};

export default function AbusePage() {
  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-14">
        <h1 className="text-3xl font-bold text-slate-900">Report abuse</h1>
        <p className="mt-3 text-slate-600">
          DNS Previewer is a free tool for legitimate DNS migration testing. If a preview is being
          used to impersonate a site, phish, or bypass access controls, tell us — we kill sessions
          fast.
        </p>
        <div className="mt-8 card">
          <h2 className="font-semibold">How to report</h2>
          <p className="mt-3 text-slate-600">
            Email <a href="mailto:abuse@dnspreviewer.com" className="text-brand-700">abuse@dnspreviewer.com</a>{" "}
            with:
          </p>
          <ul className="mt-3 list-disc pl-5 text-slate-700 space-y-1">
            <li>The preview subdomain (e.g. <code>a7xk2p.dnspreviewer.com</code>)</li>
            <li>A short description of what&rsquo;s wrong</li>
            <li>Optional: a screenshot or URL example</li>
          </ul>
          <p className="mt-4 text-sm text-slate-500">
            Previews already expire in 15 minutes. For urgent takedowns, mark the email subject
            <code> [URGENT]</code>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
