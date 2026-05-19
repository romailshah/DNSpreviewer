"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface AdminPreview {
  id: string;
  label: string | null;
  domain: string;
  target: string;
  protocol: string;
  siteType: string;
  subdomain: string | null;
  passwordProtected: boolean;
  createdAt: number;
  expiresAt: number | null;
  disabled: boolean;
  hitCount: number;
  creatorIp: string;
  userEmail: string | null;
  userId: string | null;
}

export function PreviewsTable({
  initial,
  rootDomain,
  initialQuery,
  initialStatus,
}: {
  initial: AdminPreview[];
  rootDomain: string;
  initialQuery: string;
  initialStatus: "all" | "active" | "expired" | "disabled";
}) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const allVisibleIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));
  const someSelected = !allSelected && allVisibleIds.some((id) => selected.has(id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allVisibleIds));
    }
  }

  async function refetch(nextQ: string, nextStatus: string) {
    setLoading(true);
    try {
      const url = `/api/admin/previews?q=${encodeURIComponent(nextQ)}&status=${nextStatus}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRows(data.previews);
        // Keep only selections that still exist in the new result set.
        setSelected((s) => {
          const valid = new Set<string>(data.previews.map((p: AdminPreview) => p.id));
          return new Set([...s].filter((id) => valid.has(id)));
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleDisabled(id: string, disabled: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ disabled }),
      });
      if (res.ok) setRows((list) => list.map((r) => (r.id === id ? { ...r, disabled } : r)));
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this preview? This cannot be undone.")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) setRows((list) => list.filter((r) => r.id !== id));
    } finally {
      setBusy(null);
    }
  }

  async function runBulk(action: "disable" | "enable" | "delete") {
    const ids = [...selected];
    if (ids.length === 0) return;
    const verb = action === "delete" ? "Delete" : action === "disable" ? "Disable" : "Enable";
    const warning =
      action === "delete"
        ? `Delete ${ids.length} preview${ids.length === 1 ? "" : "s"}? This cannot be undone.`
        : `${verb} ${ids.length} preview${ids.length === 1 ? "" : "s"}?`;
    if (!confirm(warning)) return;

    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/previews/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Bulk ${action} failed: ${data.error || res.status}`);
        return;
      }
      const data = await res.json();
      if (data.failed > 0) {
        alert(`${data.succeeded} succeeded, ${data.failed} failed.`);
      }
      const idSet = new Set<string>(ids);
      if (action === "delete") {
        setRows((list) => list.filter((r) => !idSet.has(r.id)));
      } else {
        const disabled = action === "disable";
        setRows((list) => list.map((r) => (idSet.has(r.id) ? { ...r, disabled } : r)));
      }
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <input
          type="search"
          placeholder="Search domain, target, label, email, or ID…"
          className="input max-w-md"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && refetch(q, status)}
        />
        <select
          className="input max-w-[10rem]"
          value={status}
          onChange={(e) => {
            const s = e.target.value as typeof status;
            setStatus(s);
            refetch(q, s);
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="expired">Expired only</option>
          <option value="disabled">Disabled only</option>
        </select>
        <button className="btn-ghost" onClick={() => refetch(q, status)} disabled={loading}>
          {loading ? "…" : "Search"}
        </button>
      </div>

      {selectedCount > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm">
          <span className="font-semibold text-brand-700">
            {selectedCount} selected
          </span>
          <span className="text-ink-500">·</span>
          <button
            onClick={() => runBulk("disable")}
            disabled={bulkBusy}
            className="btn-ghost text-xs py-1 px-2"
          >
            Disable
          </button>
          <button
            onClick={() => runBulk("enable")}
            disabled={bulkBusy}
            className="btn-ghost text-xs py-1 px-2"
          >
            Enable
          </button>
          <button
            onClick={() => runBulk("delete")}
            disabled={bulkBusy}
            className="btn-ghost text-xs py-1 px-2 !text-red-700 !border-red-200 hover:!bg-red-50"
          >
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            disabled={bulkBusy}
            className="btn-ghost text-xs py-1 px-2 ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 text-xs uppercase tracking-wide">
              <th className="pb-3 pr-2 w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                />
              </th>
              <th className="pb-3 pr-4">Preview</th>
              <th className="pb-3 pr-4 hidden md:table-cell">Owner</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4 text-right hidden sm:table-cell">Hits</th>
              <th className="pb-3 pr-4 hidden lg:table-cell">Created</th>
              <th className="pb-3 pr-4 hidden lg:table-cell">Expires</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const expired = p.expiresAt !== null && p.expiresAt < Date.now();
              const isSelected = selected.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={`border-t border-ink-100 align-top ${isSelected ? "bg-brand-50/40" : ""}`}
                >
                  <td className="py-3 pr-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.id}`}
                      checked={isSelected}
                      onChange={() => toggleOne(p.id)}
                    />
                  </td>
                  <td className="py-3 pr-4 max-w-[240px] sm:max-w-none">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-brand-600 break-all">{p.id}</span>
                      {p.passwordProtected && <Tag>🔒</Tag>}
                      {p.expiresAt === null && <Tag>♾️</Tag>}
                      {p.siteType === "wildcard" && <Tag>Wildcard</Tag>}
                      {p.siteType === "subdomain" && <Tag>Sub</Tag>}
                    </div>
                    <div className="text-xs mt-1 text-ink-700 break-all">
                      {p.label && <strong>{p.label} · </strong>}
                      <code>{p.domain}</code> → <code>{p.target}</code>
                    </div>
                    {/* Mobile-only: show owner + stats inline */}
                    <div className="text-[11px] mt-1 text-ink-500 md:hidden break-all">
                      {p.userEmail || `anon ${p.creatorIp}`} · {p.hitCount} hit{p.hitCount === 1 ? "" : "s"}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs break-all hidden md:table-cell">
                    {p.userEmail ? (
                      <span className="text-ink-900">{p.userEmail}</span>
                    ) : (
                      <span className="text-ink-500">
                        anon <code>{p.creatorIp}</code>
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={p.disabled ? "disabled" : expired ? "expired" : "active"} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums hidden sm:table-cell">{p.hitCount}</td>
                  <td className="py-3 pr-4 text-xs text-ink-700 hidden lg:table-cell">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-700 hidden lg:table-cell">
                    {p.expiresAt === null ? "—" : new Date(p.expiresAt).toLocaleString()}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      <Link href={`/s/${p.id}`} className="btn-ghost text-xs py-1 px-2">
                        Details
                      </Link>
                      <a
                        href={`http${rootDomain === "localhost" ? "" : "s"}://${p.id}.${rootDomain}${rootDomain === "localhost" ? ":3000" : ""}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-ghost text-xs py-1 px-2"
                      >
                        Open
                      </a>
                      <button
                        onClick={() => toggleDisabled(p.id, !p.disabled)}
                        disabled={busy === p.id}
                        className="btn-ghost text-xs py-1 px-2"
                      >
                        {p.disabled ? "Enable" : "Disable"}
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        disabled={busy === p.id}
                        className="btn-ghost text-xs py-1 px-2 !text-red-700 !border-red-200 hover:!bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-ink-500">
                  No previews match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink-100 text-ink-700 px-1.5 py-0.5 text-[10px] font-medium">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: "active" | "expired" | "disabled" }) {
  const map = {
    active: { cls: "bg-emerald-100 text-emerald-800", text: "Active" },
    expired: { cls: "bg-ink-100 text-ink-500", text: "Expired" },
    disabled: { cls: "bg-amber-100 text-amber-800", text: "Disabled" },
  };
  const { cls, text } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {text}
    </span>
  );
}
