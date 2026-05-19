"use client";

import { useEffect, useState } from "react";

export function SessionStatus({
  id,
  expiresAt,
  previewUrl,
  noExpiry,
}: {
  id: string;
  expiresAt: number | null;
  previewUrl: string;
  noExpiry: boolean;
}) {
  const [remaining, setRemaining] = useState(() =>
    expiresAt === null ? null : Math.max(0, expiresAt - Date.now()),
  );
  const [hits, setHits] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (expiresAt === null) return;
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setHits(data.hitCount);
      } catch {}
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  const timeValue = noExpiry ? (
    <span className="text-brand-600">∞ No expiry</span>
  ) : remaining === null ? (
    "—"
  ) : remaining <= 0 ? (
    <span className="text-red-600">Expired</span>
  ) : (
    <span className="tabular-nums">
      {String(Math.floor(remaining / 60000)).padStart(2, "0")}:
      {String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0")}
    </span>
  );

  return (
    <div className="mt-6 grid sm:grid-cols-3 gap-4">
      <Stat label="Time remaining" value={timeValue} />
      <Stat label="Requests served" value={hits == null ? "…" : String(hits)} />
      <div className="card flex items-center justify-center">
        <button onClick={copy} className="btn-ghost w-full">
          {copied ? "Copied!" : "Copy URL"}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card">
      <div className="text-xs font-semibold text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-display font-bold text-ink-900">{value}</div>
    </div>
  );
}
