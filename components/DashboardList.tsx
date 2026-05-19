"use client";

import { useState } from "react";
import Link from "next/link";

export interface DashboardSession {
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
  previewHost: string;
}

export function DashboardList({ initialSessions }: { initialSessions: DashboardSession[] }) {
  const [sessions, setSessions] = useState(initialSessions);

  async function toggleDisabled(id: string, disabled: boolean) {
    const res = await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ disabled }),
    });
    if (res.ok) {
      setSessions((list) => list.map((s) => (s.id === id ? { ...s, disabled } : s)));
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this preview? This cannot be undone.")) return;
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) setSessions((list) => list.filter((s) => s.id !== id));
  }

  return (
    <div className="grid gap-4">
      {sessions.map((s) => (
        <Row key={s.id} s={s} onToggle={toggleDisabled} onDelete={remove} />
      ))}
    </div>
  );
}

function Row({
  s,
  onToggle,
  onDelete,
}: {
  s: DashboardSession;
  onToggle: (id: string, disabled: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const url = s.previewHost.endsWith(".localhost")
    ? `http://${s.previewHost}:3000/`
    : `https://${s.previewHost}/`;
  const expired = s.expiresAt !== null && s.expiresAt < Date.now();
  const status = s.disabled ? "disabled" : expired ? "expired" : "active";

  return (
    <div className="card flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-semibold text-ink-900">
            {s.label || s.domain}
          </span>
          <StatusBadge status={status} />
          {s.passwordProtected && <Tag>🔒 Password</Tag>}
          {s.expiresAt === null && <Tag>♾️ No expiry</Tag>}
          {s.siteType === "wildcard" && <Tag>Wildcard</Tag>}
          {s.siteType === "subdomain" && <Tag>Subdomain</Tag>}
        </div>
        <div className="mt-2 text-sm text-ink-700">
          <code>{s.domain}</code> → <code>{s.target}</code>{" "}
          <span className="text-ink-500">· {protocolLabel(s.protocol)}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block truncate text-sm font-mono text-brand-600 hover:underline"
        >
          {url}
        </a>
        <div className="mt-2 text-xs text-ink-500">
          {s.hitCount} hit{s.hitCount === 1 ? "" : "s"} · created{" "}
          {new Date(s.createdAt).toLocaleString()}
          {s.expiresAt !== null && ` · expires ${new Date(s.expiresAt).toLocaleString()}`}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:shrink-0">
        <a href={url} target="_blank" rel="noreferrer" className="btn-ghost text-sm py-1.5 px-3">Open</a>
        <Link href={`/s/${s.id}`} className="btn-ghost text-sm py-1.5 px-3">Details</Link>
        <button
          onClick={() => onToggle(s.id, !s.disabled)}
          className="btn-ghost text-sm py-1.5 px-3"
          title={s.disabled ? "Re-enable" : "Disable"}
        >
          {s.disabled ? "Enable" : "Disable"}
        </button>
        <button
          onClick={() => onDelete(s.id)}
          className="btn-ghost text-sm py-1.5 px-3 !text-red-700 !border-red-200 hover:!bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function protocolLabel(p: string) {
  if (p === "https") return "HTTPS";
  if (p === "http") return "HTTP";
  return "HTTP+HTTPS";
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
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
