import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <>
      <SiteHeader />
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

        <nav className="mt-6 flex flex-wrap gap-0.5 sm:gap-1 border-b border-ink-200 -mx-2 sm:mx-0 px-2 sm:px-0 overflow-x-auto">
          <AdminNavLink href="/admin" label="Overview" />
          <AdminNavLink href="/admin/previews" label="Previews" />
          <AdminNavLink href="/admin/users" label="Users" />
          <AdminNavLink href="/admin/activity" label="Activity log" />
        </nav>

        <div className="mt-6 sm:mt-8">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 sm:px-4 py-2 -mb-px text-xs sm:text-sm font-semibold text-ink-700 border-b-2 border-transparent hover:text-brand-600 hover:border-brand-300 transition-colors whitespace-nowrap"
    >
      {label}
    </Link>
  );
}
