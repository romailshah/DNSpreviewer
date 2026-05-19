"use client";

import { useState } from "react";
import type { AdminUserRow } from "@/lib/auth";

export function UsersTable({ initialUsers }: { initialUsers: AdminUserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const filtered = users.filter(
    (u) => !filter || u.email.toLowerCase().includes(filter.toLowerCase()),
  );

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || `Error ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.user) {
        setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This removes all their previews. Cannot be undone.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || `Error ${res.status}`);
        return;
      }
      setUsers((list) => list.filter((u) => u.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by email…"
          className="input max-w-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-500 text-xs uppercase tracking-wide">
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4 hidden sm:table-cell">Role</th>
              <th className="pb-3 pr-4 hidden sm:table-cell">Status</th>
              <th className="pb-3 pr-4 text-right hidden md:table-cell">Previews</th>
              <th className="pb-3 pr-4 hidden lg:table-cell">Created</th>
              <th className="pb-3 pr-4 hidden lg:table-cell">Last login</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-ink-100 align-top">
                <td className="py-3 pr-4 break-all max-w-[260px] sm:max-w-none">
                  <div className="font-medium text-ink-900">{u.email}</div>
                  <div className="text-[11px] text-ink-500 font-mono">{u.id}</div>
                  {/* Mobile-only: show role/status/count inline since those columns are hidden */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 sm:hidden">
                    {u.role === "admin" ? (
                      <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-800 px-2 py-0.5 text-[10px] font-semibold">
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-ink-100 text-ink-700 px-2 py-0.5 text-[10px] font-semibold">
                        User
                      </span>
                    )}
                    {u.disabled ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold">
                        Disabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                        Active
                      </span>
                    )}
                    <span className="text-[11px] text-ink-500">
                      · {u.previewCount} preview{u.previewCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 hidden sm:table-cell">
                  {u.role === "admin" ? (
                    <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-800 px-2 py-0.5 text-[11px] font-semibold">
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-ink-100 text-ink-700 px-2 py-0.5 text-[11px] font-semibold">
                      User
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 hidden sm:table-cell">
                  {u.disabled ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-semibold">
                      Disabled
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[11px] font-semibold">
                      Active
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums hidden md:table-cell">{u.previewCount}</td>
                <td className="py-3 pr-4 text-xs text-ink-700 hidden lg:table-cell">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 pr-4 text-xs text-ink-700 hidden lg:table-cell">
                  {u.lastActivityAt ? new Date(u.lastActivityAt).toLocaleDateString() : "—"}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => patch(u.id, { role: u.role === "admin" ? "user" : "admin" })}
                      disabled={busy === u.id}
                      className="btn-ghost text-xs py-1 px-2"
                    >
                      {u.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button
                      onClick={() => patch(u.id, { disabled: !u.disabled })}
                      disabled={busy === u.id}
                      className="btn-ghost text-xs py-1 px-2"
                    >
                      {u.disabled ? "Enable" : "Disable"}
                    </button>
                    <button
                      onClick={() => remove(u.id, u.email)}
                      disabled={busy === u.id}
                      className="btn-ghost text-xs py-1 px-2 !text-red-700 !border-red-200 hover:!bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-ink-500">
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
