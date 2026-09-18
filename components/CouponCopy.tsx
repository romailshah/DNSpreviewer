"use client";

import { useState } from "react";

/** A coupon code styled as a tear-off ticket that copies itself on click. */
export function CouponCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (http, iframes). The code is still visible to type.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="group w-full rounded-xl border-2 border-dashed border-brand-400/70 bg-white/5 px-4 py-3 text-left transition hover:border-brand-400 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
      aria-label={`Copy coupon code ${code}`}
    >
      <span className="block text-[10px] font-bold uppercase tracking-wide text-brand-300">
        Extra discount code
      </span>
      <span className="mt-1 flex items-center justify-between gap-3">
        <span className="font-mono text-lg font-bold tracking-wider text-white">{code}</span>
        <span
          className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold transition ${
            copied ? "bg-emerald-500 text-white" : "bg-white/10 text-white/80 group-hover:bg-white/20"
          }`}
        >
          {copied ? "Copied" : "Copy"}
        </span>
      </span>
    </button>
  );
}
