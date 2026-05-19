import { listAllSessionsAdmin } from "@/lib/sessions";
import { PreviewsTable } from "@/components/admin/PreviewsTable";
import { ROOT_DOMAIN } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Previews" };

interface PageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AdminPreviewsPage({ searchParams }: PageProps) {
  const { q = "", status = "all" } = await searchParams;
  const safeStatus: "all" | "active" | "expired" | "disabled" =
    status === "active" || status === "expired" || status === "disabled" ? status : "all";

  const rows = listAllSessionsAdmin({ search: q, status: safeStatus, limit: 500 });
  const initial = rows.map((s) => ({
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
    creatorIp: s.creatorIp,
    userEmail: s.userEmail,
    userId: s.userId,
  }));

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="heading text-2xl text-ink-900">All previews</h2>
          <p className="text-sm text-ink-700">
            {initial.length} showing · disable, delete, or inspect
          </p>
        </div>
      </div>
      <div className="mt-6">
        <PreviewsTable initial={initial} rootDomain={ROOT_DOMAIN} initialQuery={q} initialStatus={safeStatus} />
      </div>
    </>
  );
}
