import type { ReactNode } from "react";

/**
 * Top-of-page diagram for /how-it-works. Two lanes: live visitors still
 * reaching the old server, and the preview reaching the new server under the
 * same domain. Built from HTML rather than an image so the labels stay crisp,
 * reflow on mobile, and remain readable text for search engines and LLMs.
 *
 * The IPs are RFC 5737 documentation addresses, never real servers.
 */
export function HowItWorksDiagram() {
  return (
    <figure className="rounded-2xl sm:rounded-3xl border border-ink-200 bg-white shadow-soft p-4 sm:p-6 lg:p-8">
      <Lane label="Your visitors, the whole time" tone="muted">
        <Node tone="muted" icon={<UsersIcon />} title="Visitors" detail="type example.com" />
        <Flow tone="muted" label="DNS still points to the old server" wide />
        <Node tone="muted" icon={<ServerIcon />} title="Old server" detail="198.51.100.7" />
      </Lane>

      <div className="my-5 sm:my-6 border-t border-dashed border-ink-200" />

      <Lane label="You, before changing anything" tone="brand">
        <Node tone="brand" icon={<DevicesIcon />} title="You or your client" detail="any browser or phone" />
        <Flow tone="brand" />
        <Node tone="brand" icon={<LinkIcon />} title="Preview link" detail="x7k3p.dnspreviewer.com" />
        <Flow tone="brand" />
        <Node
          tone="solid"
          icon={<ShieldIcon />}
          title="DNS Previewer"
          detail={
            <>
              Host: example.com
              <br />
              SNI: example.com
            </>
          }
        />
        <Flow tone="brand" />
        <Node tone="brand" icon={<ServerIcon />} title="New server" detail="203.0.113.42" />
      </Lane>

      <figcaption className="mt-6 sm:mt-7 text-sm text-ink-700 leading-relaxed lg:text-center lg:max-w-2xl lg:mx-auto">
        Nothing about your live site changes. Visitors keep reaching the old server, while the
        preview link shows you the new one under your real domain name. Once it all checks out,
        you update DNS.
      </figcaption>
    </figure>
  );
}

type Tone = "muted" | "brand" | "solid";

const COLUMNS =
  "lg:grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)_2.75rem_minmax(0,1fr)_2.75rem_minmax(0,1fr)]";

function Lane({ label, tone, children }: { label: string; tone: "muted" | "brand"; children: ReactNode }) {
  return (
    <div>
      <div
        className={`mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide ${
          tone === "brand" ? "text-brand-700" : "text-ink-500"
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${tone === "brand" ? "bg-brand-500" : "bg-ink-300"}`} />
        {label}
      </div>
      <div className={`grid grid-cols-1 ${COLUMNS} lg:items-center`}>{children}</div>
    </div>
  );
}

const NODE_TONES: Record<Tone, { box: string; icon: string; title: string; detail: string }> = {
  muted: {
    box: "border-ink-200 bg-ink-50",
    icon: "bg-white text-ink-500 border border-ink-200",
    title: "text-ink-700",
    detail: "text-ink-500",
  },
  brand: {
    box: "border-brand-200 bg-white",
    icon: "bg-brand-50 text-brand-600 border border-brand-100",
    title: "text-ink-900",
    detail: "text-brand-700",
  },
  solid: {
    box: "border-brand-500 bg-brand-500 shadow-glow",
    icon: "bg-white/15 text-white border border-white/25",
    title: "text-white",
    detail: "text-white/90",
  },
};

function Node({ tone, icon, title, detail }: { tone: Tone; icon: ReactNode; title: string; detail: ReactNode }) {
  const t = NODE_TONES[tone];
  return (
    <div className={`rounded-xl border px-3 py-3 lg:py-4 ${t.box}`}>
      <div className="flex items-center gap-3 lg:flex-col lg:gap-2 lg:text-center">
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.icon}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <div className={`font-display text-sm font-semibold ${t.title}`}>{title}</div>
          <div className={`mt-0.5 font-mono text-[11px] leading-snug break-all ${t.detail}`}>{detail}</div>
        </div>
      </div>
    </div>
  );
}

function Flow({ tone, label, wide }: { tone: "muted" | "brand"; label?: string; wide?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 py-1.5 lg:px-1 lg:py-0 ${
        wide ? "lg:col-span-5 lg:px-3" : ""
      } ${tone === "brand" ? "text-brand-500" : "text-ink-300"}`}
    >
      {label && <span className="text-center text-xs text-ink-500">{label}</span>}
      <span className={`flow-line ${tone === "brand" ? "flow-line-moving" : ""}`} aria-hidden="true" />
    </div>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function UsersIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.3c1.8.8 3 2.9 3 5.7" />
    </svg>
  );
}

function DevicesIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2" y="4" width="14" height="10" rx="1.5" />
      <path d="M5 18h8" />
      <rect x="17" y="8" width="5" height="12" rx="1" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z" />
      <path d="M8.5 12h7M13 9.5l2.5 2.5-2.5 2.5" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3.5" width="18" height="7" rx="1.5" />
      <rect x="3" y="13.5" width="18" height="7" rx="1.5" />
      <path d="M7 7h.01M7 17h.01" />
    </svg>
  );
}
