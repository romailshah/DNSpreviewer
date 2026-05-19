import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AuthForm } from "@/components/AuthForm";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your DNS Previewer account to manage saved previews.",
  alternates: { canonical: "https://dnspreviewer.com/login" },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-20">
        <div className="text-center">
          <h1 className="heading mt-4 text-4xl text-ink-900">Welcome back</h1>
          <p className="mt-3 text-ink-700">Log in to see your saved previews.</p>
        </div>
        <div className="mt-10 max-w-md mx-auto">
          <AuthForm mode="login" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
