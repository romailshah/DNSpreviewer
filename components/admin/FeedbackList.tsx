"use client";

import { adminDateTime } from "@/lib/adminTime";
import { useState } from "react";
import type { Feedback } from "@/lib/feedback";

const KIND_META: Record<Feedback["kind"], { label: string; color: string }> = {
  problem: { label: "Problem", color: "bg-red-100 text-red-800" },
  idea: { label: "Idea", color: "bg-violet-100 text-violet-800" },
  question: { label: "Question", color: "bg-sky-100 text-sky-800" },
  help: { label: "Migration job", color: "bg-emerald-100 text-emerald-800" },
};

export function FeedbackList({ initialItems }: { initialItems: Feedback[] }) {
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState<number | null>(null);

  async function toggle(f: Feedback) {
    const status = f.status === "new" ? "done" : "new";
    setBusy(f.id);
    const res = await fetch(`/api/admin/feedback/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    if (res.ok) setItems((all) => all.map((x) => (x.id === f.id ? { ...x, status } : x)));
  }

  if (items.length === 0) {
    return <div className="card text-center text-ink-700">No feedback yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {items.map((f) => {
        const meta = KIND_META[f.kind];
        const replyTo = f.email ?? f.userEmail;
        return (
          <li key={f.id} className={`card !p-4 sm:!p-5 ${f.status === "done" ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${meta.color}`}>{meta.label}</span>
              {f.status === "new" && (
                <span className="rounded-full bg-brand-500 px-2 py-0.5 font-semibold text-white">New</span>
              )}
              <span className="text-ink-500">{adminDateTime(f.createdAt)}</span>
              {f.page && <span className="font-mono text-ink-500">{f.page}</span>}
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-ink-900">{f.message}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-500">
              <span className="break-all">
                {replyTo ? (
                  <a
                    className="font-medium text-brand-600 hover:underline"
                    href={`mailto:${replyTo}?subject=${encodeURIComponent("Re: your DNS Previewer feedback")}`}
                  >
                    Reply to {replyTo}
                  </a>
                ) : (
                  "No email left"
                )}
                {f.userId && " · signed-in user"}
                {f.ip && ` · ${f.ip}`}
              </span>
              <button
                type="button"
                onClick={() => toggle(f)}
                disabled={busy === f.id}
                className="btn-ghost !px-3 !py-1.5 text-xs"
              >
                {f.status === "new" ? "Mark done" : "Reopen"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
