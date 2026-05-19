import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { currentUser } from "@/lib/auth";
import { listSessionsByUser } from "@/lib/sessions";
import { ROOT_DOMAIN } from "@/lib/env";
import { DashboardList } from "@/components/DashboardList";

export const dynamic = "force-dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const sessions = listSessionsByUser(user.id).map((s) => ({
    id: s.id,
    label: s.label,
    domain: s.domain,
    target: s.target,
    protocol: s.protocol,
    siteType: s.siteType,
    subdomain: s.subdomain,
    passwordProtected: Boolean(s.passwordHash),
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    disabled: s.disabled,
    hitCount: s.hitCount,
    previewHost: `${s.id}.${ROOT_DOMAIN}`,
  }));

  return (
    <>
      <SiteHeader />
      <main className="container-wide py-14">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="heading text-3xl md:text-4xl text-ink-900">Your previews</h1>
            <p className="mt-2 text-ink-700">
              Logged in as <span className="font-semibold text-ink-900">{user.email}</span>
            </p>
          </div>
          <Link href="/create" className="btn-primary">+ New preview</Link>
        </div>

        <div className="mt-8">
          {sessions.length === 0 ? (
            <EmptyState />
          ) : (
            <DashboardList initialSessions={sessions} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function EmptyState() {
  return (
    <div className="card text-center py-16">
      <div className="text-5xl">🔗</div>
      <h2 className="heading mt-4 text-xl text-ink-900">No previews yet</h2>
      <p className="mt-2 text-ink-700">Create your first preview — takes under a minute.</p>
      <Link href="/create" className="btn-primary mt-6 inline-flex">Create a preview</Link>
    </div>
  );
}
