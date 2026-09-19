import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { countNewFeedback } from "@/lib/feedback";
import { NoAnalyticsMarker } from "@/components/admin/NoAnalyticsMarker";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

// Every page under /admin/* inherits this — admin console must never be indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <>
      <SiteHeader />
      <NoAnalyticsMarker />
      <main className="container-wide py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <span className="chip-free">Admin console</span>
            <h1 className="heading mt-3 text-2xl sm:text-3xl md:text-4xl text-ink-900">DNS Previewer Admin</h1>
            <p className="mt-1 text-ink-700 text-sm break-all">
              Logged in as <strong>{user.email}</strong>
            </p>
          </div>
        </div>

        <nav className="mt-6 flex gap-0.5 sm:gap-1 border-b border-ink-200 -mx-4 sm:mx-0 px-2 sm:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AdminNavLink href="/admin" label="Overview" />
          <AdminNavLink href="/admin/previews" label="Previews" />
          <AdminNavLink href="/admin/users" label="Users" />
          <AdminNavLink href="/admin/feedback" label="Feedback" badge={countNewFeedback()} />
          <AdminNavLink href="/admin/activity" label="Activity log" />
        </nav>

        <div className="mt-6 sm:mt-8">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

function AdminNavLink({ href, label, badge }: { href: string; label: string; badge?: number }) {
  return (
    <Link
      href={href}
      className="shrink-0 inline-flex items-center px-3 sm:px-4 py-2 -mb-px text-xs sm:text-sm font-semibold text-ink-700 border-b-2 border-transparent hover:text-brand-600 hover:border-brand-300 transition-colors whitespace-nowrap"
    >
      {label}
      {badge ? (
        <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
