import Link from "next/link";

/**
 * Offer to have the migration done for you. Opens the Help & feedback panel
 * pre-set to "Migrate it for me" (via ?feedback=help), so requests land in
 * /admin/feedback as "Migration job" with the sender's email.
 *
 * Dark, like the hosting pick, so it stands apart from the page as an
 * offer rather than a paragraph. Shown on the preview-ready page and on posts that set
 * `hireCta: true`.
 */
export function MigrationHelpCard({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-ink-900 via-ink-900 to-[#2a1606] p-5 sm:p-7 text-white shadow-glow ring-1 ring-brand-500/40 ${className}`}
    >
      <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-10 h-52 w-52 rounded-full bg-brand-600/25 blur-3xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
        <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-2">
          <span
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white ring-4 ring-brand-500/30"
            aria-hidden="true"
          >
            <TruckIcon />
          </span>
          <span className="rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Done for you
          </span>
        </div>

        <div className="flex-1">
          <p className="font-display text-xl sm:text-2xl font-bold leading-tight">
            Rather not do the move yourself?
          </p>
          <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed">
            I&rsquo;m Romail. I built DNS Previewer, and I migrate client sites for a living. Tell me what
            you&rsquo;re moving and I&rsquo;ll reply with a fixed quote, no obligation.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-white/90">
            <li className="inline-flex items-center gap-1.5">
              <TickIcon /> Fixed quote before I start
            </li>
            <li className="inline-flex items-center gap-1.5">
              <TickIcon /> Checked on the new server before DNS changes
            </li>
          </ul>
        </div>

        <Link
          href="?feedback=help"
          scroll={false}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white shadow-glow transition hover:bg-brand-400"
        >
          Get a quote
          <ArrowIcon />
        </Link>
      </div>
    </aside>
  );
}

function TruckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5h11.5v9.5H2z" />
      <path d="M13.5 10h4.2l3.3 3.3V16h-7.5" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg className="shrink-0 text-brand-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
