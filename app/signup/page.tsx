import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Sign up — DNS Previewer" };

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-20">
        <div className="text-center">
          <span className="chip-free">100% free</span>
          <h1 className="heading mt-4 text-4xl text-ink-900">Create your account</h1>
          <p className="mt-3 text-ink-700">
            Free forever. Unlocks password protection, no-expiry links, and a dashboard.
          </p>
        </div>
        <div className="mt-10 max-w-md mx-auto">
          <AuthForm mode="signup" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
