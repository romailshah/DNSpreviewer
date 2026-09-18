import Link from "next/link";

/**
 * Soft offer to have the migration done for you. Opens the Help & feedback
 * panel pre-set to "Migrate it for me" (via ?feedback=help), so requests land
 * in /admin/feedback as "Migration job" with the sender's email.
 *
 * Shown where people are mid-migration or stuck: the preview-ready page and
 * the problem-solving blog posts that set `hireCta: true`.
 */
export function MigrationHelpCard({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`rounded-2xl border border-ink-200 bg-white p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 ${className}`}
    >
      <span
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-sm font-bold text-white"
        aria-hidden="true"
      >
        RS
      </span>
      <div className="flex-1">
        <p className="font-display font-semibold text-ink-900">Rather not do the move yourself?</p>
        <p className="mt-1 text-sm text-ink-700 leading-relaxed">
          I&rsquo;m Romail. I built DNS Previewer, and I migrate client sites for a living. Tell me
          what you&rsquo;re moving and I&rsquo;ll reply with a fixed quote, no obligation.
        </p>
      </div>
      <Link href="?feedback=help" scroll={false} className="btn-primary shrink-0 w-full sm:w-auto">
        Get a quote
      </Link>
    </aside>
  );
}
