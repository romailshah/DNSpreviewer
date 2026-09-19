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

      {/* Same two-column layout as the hosting card: pitch on the left,
          what you get plus the button on the right. */}
      <div className="relative grid gap-5 sm:grid-cols-[1fr_15rem] sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            <TruckIcon />
            Done for you
          </span>
          <p className="mt-3 font-display text-xl sm:text-2xl font-bold leading-tight">
            Migration not going to plan?
          </p>
          <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed">
            Hand it over. I&rsquo;m Romail, I built DNS Previewer, and I migrate client sites for a living.
            Tell me what you&rsquo;re moving and I&rsquo;ll reply with a fixed quote, no obligation.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <ul className="space-y-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90">
            <li className="flex items-start gap-2">
              <TickIcon /> Fixed quote before I start
            </li>
            <li className="flex items-start gap-2">
              <TickIcon /> Checked on the new server before DNS changes
            </li>
          </ul>
          <Link
            href="?feedback=help"
            scroll={false}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white shadow-glow transition hover:bg-brand-400"
          >
            Get a quote
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function TruckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 6.5h11.5v9.5H2z" />
      <path d="M13.5 10h4.2l3.3 3.3V16h-7.5" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg className="mt-0.5 shrink-0 text-brand-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
