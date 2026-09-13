import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Top-of-page explainer for /how-it-works: the migration steps without DNS
 * Previewer next to the same migration with it. Built from HTML rather than
 * an image so it reflows on mobile and stays readable text for search
 * engines and LLMs. The "with" panel reuses the homepage CTA gradient.
 *
 * Used on /how-it-works (panel titles are h2) and on the homepage under its
 * own section heading (panel titles are h3, CTA scrolls to the hero form).
 */
export function HowItWorksDiagram({
  headingLevel = "h2",
  ctaHref = "/",
}: {
  headingLevel?: "h2" | "h3";
  ctaHref?: string;
} = {}) {
  return (
    <div className="relative grid gap-5 lg:grid-cols-2 lg:gap-8">
      <span
        className="hidden lg:inline-flex absolute left-1/2 top-10 z-10 h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-ink-900 font-display text-sm font-bold text-white ring-8 ring-cream"
        aria-hidden="true"
      >
        vs
      </span>

      <Panel
        tone="without"
        title="Without DNS Previewer"
        tagline="Switch first, find out later."
        headingLevel={headingLevel}
      >
        <Step tone="without" n={1} title="Copy your site to the new server">
          Files, database and SSL certificate.
        </Step>
        <Step tone="without" n={2} title="Switch DNS and hope">
          There&rsquo;s no easy way to see the new server under your real domain first.
        </Step>
        <Step tone="without" n={3} title="Wait for DNS to update">
          Often hours, depending on the TTL on your DNS record.
        </Step>
        <Step tone="without" marker="warn" title="Find the problems live" last>
          Your visitors spot them before you do.
          <MiniBrowser url="example.com" variant="error" />
        </Step>
        <div className="mt-5 sm:mt-6 inline-flex items-center gap-2 self-start rounded-xl bg-red-50 px-3 py-2 sm:px-3.5 text-[13px] sm:text-sm font-medium text-red-700">
          <WarnIcon />
          Rolling back means another DNS change and another wait
        </div>
      </Panel>

      <Panel tone="with" title="With DNS Previewer" tagline="Check first, switch when it works." headingLevel={headingLevel}>
        <Step tone="with" n={1} title="Copy your site to the new server">
          Same as before. Your live site stays put.
        </Step>
        <Step tone="with" n={2} title="Generate a preview link">
          Enter your domain and the new server&rsquo;s IP address.
        </Step>
        <Step tone="with" n={3} title="Check it in your browser">
          Your real domain, served from the new server. Send it to a client or open it on your phone.
          <MiniBrowser url="x7k3p.dnspreviewer.com" variant="ok" />
        </Step>
        <Step tone="with" marker="done" title="Everything works? Switch DNS" last>
          Visitors go straight to a working new site.
        </Step>
        <Link
          href={ctaHref}
          className="mt-5 sm:mt-6 inline-flex w-full sm:w-auto items-center justify-center gap-2 self-start rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow-soft transition hover:bg-cream"
        >
          Generate a preview link
          <ArrowIcon />
        </Link>
      </Panel>
    </div>
  );
}

type Tone = "without" | "with";

function Panel({
  tone,
  title,
  tagline,
  headingLevel,
  children,
}: {
  tone: Tone;
  title: string;
  tagline: string;
  headingLevel: "h2" | "h3";
  children: ReactNode;
}) {
  const isWith = tone === "with";
  const Heading = headingLevel;
  return (
    <section
      className={`relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-8 ${
        isWith
          ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-glow"
          : "border border-ink-200 bg-white shadow-soft"
      }`}
    >
      {isWith && (
        <>
          <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-brand-400/40 blur-3xl" />
        </>
      )}
      <div className="relative">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            isWith ? "bg-white/15 text-white" : "bg-red-50 text-red-700"
          }`}
        >
          {isWith ? <CheckIcon /> : <CrossIcon />}
          {isWith ? "The safe way" : "The usual way"}
        </span>
        <Heading className={`heading mt-3 sm:mt-4 text-xl sm:text-3xl ${isWith ? "text-white" : "text-ink-900"}`}>
          {title}
        </Heading>
        <p className={`mt-1 text-sm sm:text-base sm:mt-1.5 ${isWith ? "text-white/85" : "text-ink-500"}`}>{tagline}</p>
      </div>
      <ol className="relative mt-5 sm:mt-7 flex flex-1 flex-col">{children}</ol>
    </section>
  );
}

function Step({
  tone,
  n,
  title,
  marker,
  last,
  children,
}: {
  tone: Tone;
  n?: number;
  title: string;
  marker?: "warn" | "done";
  last?: boolean;
  children: ReactNode;
}) {
  const isWith = tone === "with";
  const markerClass =
    marker === "warn"
      ? "bg-red-500 text-white border-red-500"
      : marker === "done"
        ? "bg-white text-brand-600 border-white"
        : isWith
          ? "bg-white/15 text-white border-white/40"
          : "bg-white text-ink-700 border-ink-200";
  return (
    <li className={`relative flex gap-3 sm:gap-4 ${last ? "" : "pb-4 sm:pb-6"}`}>
      {!last && (
        <span
          className={`absolute left-[13px] sm:left-[17px] top-8 sm:top-10 bottom-1 w-0.5 rounded-full ${isWith ? "bg-white/30" : "bg-ink-200"}`}
          aria-hidden="true"
        />
      )}
      <span
        className={`relative inline-flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border font-display text-xs sm:text-sm font-bold ${markerClass}`}
      >
        {marker === "warn" ? <WarnIcon /> : marker === "done" ? <CheckIcon /> : n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5 sm:pt-1.5">
        <h3
          className={`font-display text-[15px] leading-snug font-semibold sm:text-lg ${
            marker === "warn" ? "text-red-600" : isWith ? "text-white" : "text-ink-900"
          }`}
        >
          {title}
        </h3>
        <div className={`mt-0.5 sm:mt-1 text-[13px] sm:text-sm leading-relaxed ${isWith ? "text-white/85" : "text-ink-500"}`}>{children}</div>
      </div>
    </li>
  );
}

/** Tiny browser window used as an illustration inside a step. */
function MiniBrowser({ url, variant }: { url: string; variant: "error" | "ok" }) {
  const ok = variant === "ok";
  return (
    <div
      className={`mt-2.5 sm:mt-3 overflow-hidden rounded-lg sm:rounded-xl border bg-white ${
        ok ? "border-white/60 shadow-soft" : "border-red-200"
      }`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 border-b border-ink-200 bg-ink-50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-300" />
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        <span className="h-2 w-2 rounded-full bg-emerald-300" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-md border border-ink-200 bg-white px-2 py-0.5 font-mono text-[11px] text-ink-700">
          {url}
        </span>
      </div>
      {ok ? (
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 space-y-1.5">
            <div className="h-2 w-2/3 rounded-full bg-brand-200" />
            <div className="h-1.5 w-full rounded-full bg-ink-200" />
            <div className="h-1.5 w-4/5 rounded-full bg-ink-200" />
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckIcon />
            Works
          </span>
        </div>
      ) : (
        <div className="p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <WarnIcon />
            Error establishing a database connection
          </div>
          <div className="mt-2 space-y-1.5 opacity-60">
            <div className="h-1.5 w-full rounded-full bg-ink-200" />
            <div className="h-1.5 w-3/5 rounded-full bg-ink-200" />
          </div>
        </div>
      )}
    </div>
  );
}

const iconProps = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "shrink-0",
};

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 6v8M12 18.5h.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg {...iconProps} width={16} height={16} strokeWidth={2.5}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
