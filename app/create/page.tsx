import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CreateForm } from "@/components/CreateForm";
import { currentUser } from "@/lib/auth";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a preview",
  description: "Create a DNS preview link for your website on a new server.",
  alternates: { canonical: "https://dnspreviewer.com/" },
  // Noindex because the form is also on the homepage — avoids duplicate
  // content. Canonical points search engines back to /.
  robots: { index: false, follow: true },
};

export default async function CreatePage() {
  const user = await currentUser();
  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-14 md:py-20">
        <div className="text-center">
          <span className="chip-free">All features free</span>
          <h1 className="heading mt-4 text-4xl md:text-5xl text-ink-900">Create a preview</h1>
          <p className="mt-3 text-ink-700 max-w-xl mx-auto">
            Enter the domain you&rsquo;re migrating and the new server. We&rsquo;ll give you a
            private link that behaves as if DNS already switched.
          </p>
        </div>
        <div className="mt-10">
          <CreateForm isLoggedIn={!!user} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
