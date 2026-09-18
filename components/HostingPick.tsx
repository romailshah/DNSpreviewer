import Link from "next/link";
import { AFFILIATES } from "@/lib/affiliates";

/**
 * Personal hosting recommendation with the Hostinger affiliate link.
 *
 * Rules this follows, from Hostinger's affiliate agreement and brand
 * guidelines: the relationship is disclosed next to the link, the mark gets
 * the ® symbol on first use and is used as an adjective, nothing implies an
 * official partnership, and no prices are shown (they change; the link
 * shows the live one). Links carry rel="sponsored" as Google asks for paid
 * links.
 */
export function HostingPick({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { coupon } = AFFILIATES.hostinger;
  return (
    <aside
      className={`rounded-2xl border border-brand-200 bg-gradient-to-br from-white to-brand-50/60 p-5 sm:p-6 shadow-soft ${className}`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
        Where I host client sites
      </div>
      <p className="mt-2 font-display text-lg font-semibold text-ink-900">
        {compact ? "Still choosing a host for the move?" : "Moving to a new host? This is the one I use."}
      </p>
      <p className="mt-2 text-sm sm:text-base text-ink-700 leading-relaxed">
        I&rsquo;ve put client sites on Hostinger&reg; hosting for years. Small business sites go on the{" "}
        <strong className="text-ink-900">Premium</strong> plan. Anything busier, or with real traffic to
        handle, goes on <strong className="text-ink-900">Cloud Startup</strong> so it has room to grow.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <a
          href="/go/hostinger"
          target="_blank"
          rel="sponsored nofollow noopener"
          className="btn-primary w-full sm:w-auto text-center"
        >
          See Hostinger plans
        </a>
        <p className="text-sm text-ink-700">
          Code{" "}
          <code className="!bg-white border border-brand-200 font-semibold">{coupon}</code>{" "}
          takes a bit more off at checkout.
        </p>
      </div>

      <p className="mt-4 text-xs text-ink-500 leading-relaxed">
        Affiliate link: I earn a commission if you buy through it, at no extra cost to you, and the code
        only works when you sign up through it. I only recommend what I use for my own clients.{" "}
        <Link href="/affiliate-disclosure" className="underline hover:text-brand-600">
          Disclosure
        </Link>
      </p>
    </aside>
  );
}
