import { adminDateTime } from "@/lib/adminTime";
import Link from "next/link";
import { countAdmins, countUsers } from "@/lib/auth";
import {
  countAllSessions,
  hitsSince,
  recentSessions,
  sessionsCreatedSince,
  topCreatorIps,
  topDomains,
  totalHits,
} from "@/lib/sessions";
import { affiliateClicksBySource, countActivitySince, recentActivity } from "@/lib/activity";
import { ROOT_DOMAIN } from "@/lib/env";
import { ActivityRow } from "@/components/admin/ActivityRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Overview" };

export default async function AdminOverviewPage() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const users = { total: countUsers(), admins: countAdmins() };
  const previews = countAllSessions();
  const hits = {
    total: totalHits(),
    last24h: hitsSince(now - day),
    last7d: hitsSince(now - 7 * day),
  };
  const created24h = sessionsCreatedSince(now - day);
  const created7d = sessionsCreatedSince(now - 7 * day);
  const affiliate7d = countActivitySince("affiliate.click", now - 7 * day);
  const affiliate24h = countActivitySince("affiliate.click", now - day);
  const affiliateBySource = affiliateClicksBySource(now - 7 * day)
    .map((r) => `${r.src} ${r.n}`)
    .join(" · ");
  const topDomainsList = topDomains(8);
  const topIpsList = topCreatorIps(8);
  const recent = recentSessions(8);
  const activity = recentActivity(10);

  return (
    <>
      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Users" value={users.total} sub={`${users.admins} admin${users.admins === 1 ? "" : "s"}`} />
        <StatCard title="Active previews" value={previews.active} sub={`of ${previews.total} total`} />
        <StatCard title="Requests served" value={hits.total} sub={`${hits.last24h.toLocaleString()} in last 24h`} />
        <StatCard title="New previews" value={created24h} sub={`last 24h · ${created7d} last 7d`} />
      </div>

      {/* Secondary stats */}
      <div className="mt-3 sm:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Anonymous" value={previews.anonymous} sub="previews without login" />
        <StatCard title="Password-protected" value={previews.passwordProtected} sub="locked previews" />
        <StatCard
          title="Hostinger clicks"
          wide
          value={affiliate7d}
          sub={`last 7d · ${affiliate24h} in last 24h${affiliateBySource ? ` · ${affiliateBySource}` : ""}`}
        />
        <StatCard title="No-expiry" value={previews.noExpiry} sub="permanent links" />
        <StatCard title="Disabled" value={previews.disabled} sub="manually turned off" />
      </div>

      {/* Tables */}
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="card min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">Top domains previewed</h2>
            <span className="text-xs text-ink-500">{topDomainsList.length} shown</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            {topDomainsList.length === 0 ? (
              <p className="text-sm text-ink-500">No data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 text-xs uppercase tracking-wide">
                    <th className="pb-2">Domain</th>
                    <th className="pb-2 text-right">Previews</th>
                    <th className="pb-2 text-right">Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {topDomainsList.map((d) => (
                    <tr key={d.domain} className="border-t border-ink-100">
                      <td className="py-2 font-mono">{d.domain}</td>
                      <td className="py-2 text-right">{d.count}</td>
                      <td className="py-2 text-right">{d.hits ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">Top creator IPs</h2>
            <span className="text-xs text-ink-500">watch for abuse</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            {topIpsList.length === 0 ? (
              <p className="text-sm text-ink-500">No data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-500 text-xs uppercase tracking-wide">
                    <th className="pb-2">IP address</th>
                    <th className="pb-2 text-right">Previews</th>
                  </tr>
                </thead>
                <tbody>
                  {topIpsList.map((r) => (
                    <tr key={r.ip} className="border-t border-ink-100">
                      <td className="py-2 font-mono">{r.ip}</td>
                      <td className="py-2 text-right">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="card min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">Recent previews</h2>
            <Link href="/admin/previews" className="btn-text">See all →</Link>
          </div>
          <div className="mt-4">
            {recent.length === 0 ? (
              <p className="text-sm text-ink-500">No previews yet.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {recent.map((p) => (
                  <li key={p.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                      <span className="font-mono text-sm truncate min-w-0">
                        <span className="text-brand-600">{p.id}</span>.{ROOT_DOMAIN}
                      </span>
                      <span className="text-xs text-ink-500 shrink-0">
                        {adminDateTime(p.createdAt)}
                      </span>
                    </div>
                    <div className="text-xs text-ink-700 mt-1 break-all sm:break-normal sm:truncate">
                      {p.label ? <strong>{p.label} · </strong> : null}
                      <code>{p.domain}</code> → <code>{p.target}</code>{" "}
                      <span className="text-ink-500">
                        · {p.userEmail || <em>anon ({p.creatorIp})</em>}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">Recent activity</h2>
            <Link href="/admin/activity" className="btn-text">See all →</Link>
          </div>
          <div className="mt-4">
            {activity.length === 0 ? (
              <p className="text-sm text-ink-500">Nothing logged yet.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {activity.map((a) => (
                  <li key={a.id} className="py-2">
                    <ActivityRow activity={a} compact />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, sub, wide }: { title: string; value: number; sub?: string; wide?: boolean }) {
  return (
    <div className={`card !p-4 sm:!p-6 min-w-0 ${wide ? "col-span-2 lg:col-span-1" : ""}`}>
      <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-ink-500">{title}</div>
      <div className="mt-1.5 sm:mt-2 font-display text-2xl sm:text-3xl font-bold text-ink-900 tabular-nums">
        {value.toLocaleString()}
      </div>
      {sub && <div className="mt-1 text-[11px] sm:text-xs text-ink-500 break-words">{sub}</div>}
    </div>
  );
}
