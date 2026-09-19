import Link from "next/link";
import { AFFILIATES } from "@/lib/affiliates";
import { CouponCopy } from "@/components/CouponCopy";

/**
 * Personal hosting recommendation with the Hostinger affiliate link.
 *
 * Deliberately dark so it reads as a separate, sponsored block against the
 * cream article pages rather than as part of the text.
 *
 * Rules this follows, from Hostinger's affiliate agreement and brand
 * guidelines: the relationship is disclosed next to the link, the mark gets
 * the ® symbol on first use and is used as an adjective, nothing implies an
 * official partnership, and no prices are shown (they change; the link
 * shows the live one). Links carry rel="sponsored" as Google asks for paid
 * links.
 */
export function HostingPick({
  className = "",
  compact = false,
  source = "card",
}: {
  className?: string;
  compact?: boolean;
  /** Placement tag logged with the click, e.g. "post-card". */
  source?: string;
}) {
  const { coupon } = AFFILIATES.hostinger;
  return (
    <aside
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-ink-900 p-5 sm:p-7 text-white shadow-glow ring-1 ring-brand-500/40 ${className}`}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-brand-600/20 blur-3xl" />

      <div className="relative grid gap-5 sm:grid-cols-[1fr_15rem] sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            <StarIcon />
            My pick for hosting
          </span>
          <p className="mt-3 font-display text-xl sm:text-2xl font-bold leading-tight">
            {compact ? "Still choosing a host for the move?" : "Moving to a new host? This is the one I use."}
          </p>
          <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed">
            I&rsquo;ve put client sites on Hostinger&reg; hosting for years. Small business sites go on
            the <span className="font-semibold text-white">Premium</span> plan. Anything busier, or with
            real traffic to handle, goes on <span className="font-semibold text-white">Cloud Startup</span>{" "}
            so it has room to grow.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <CouponCopy code={coupon} />
          <a
            href={`/go/hostinger?src=${encodeURIComponent(source)}`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white shadow-glow transition hover:bg-brand-400"
          >
            See Hostinger plans
            <ArrowIcon />
          </a>
        </div>
      </div>

      <p className="relative mt-5 border-t border-white/10 pt-4 text-xs text-white/55 leading-relaxed">
        Affiliate link: I earn a commission if you buy through it, at no extra cost to you, and the code only
        works when you sign up through it. I only recommend what I use for my own clients.{" "}
        <Link href="/affiliate-disclosure" className="underline hover:text-white">
          Disclosure
        </Link>
      </p>
    </aside>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z" />
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
