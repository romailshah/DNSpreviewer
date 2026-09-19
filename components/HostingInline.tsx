import Link from "next/link";
import { AFFILIATES } from "@/lib/affiliates";

/**
 * One-line hosting pick that sits right under the hero form, aimed at the
 * visitor who arrives mid-plan: they want to preview a move but haven't
 * bought the new server yet, so the form's second field has nothing to go
 * in. That's the highest-intent moment on the homepage for this link.
 *
 * Carries the same disclosure rules as HostingPick in compact form: an
 * "Affiliate" label, the ® mark, rel="sponsored", and a link to the full
 * disclosure.
 */
export function HostingInline({ source }: { source: string }) {
  const { coupon } = AFFILIATES.hostinger;
  return (
    <div className="mx-auto mt-5 max-w-3xl">
      <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-ink-900 px-4 py-4 text-center text-sm text-white shadow-soft ring-1 ring-brand-500/40 sm:flex-row sm:gap-3 sm:px-5 sm:py-3 sm:text-left">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z" />
            </svg>
            My pick
          </span>
          <span className="font-semibold">No new server yet?</span>
        </div>
        <p className="flex-1 text-white/75">
          I use Hostinger&reg; hosting for client sites. Code{" "}
          <span className="font-mono font-bold text-white">{coupon}</span> takes a bit more off.
        </p>
        <div className="flex w-full shrink-0 flex-col items-center gap-1.5 sm:w-auto sm:flex-row sm:gap-3">
          <a
            href={`/go/hostinger?src=${encodeURIComponent(source)}`}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2.5 font-semibold text-white transition hover:bg-brand-400 sm:w-auto sm:py-2"
          >
            See plans
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <Link href="/affiliate-disclosure" className="text-[11px] text-white/50 underline hover:text-white">
            <span className="sm:hidden">Affiliate link, see disclosure</span>
            <span className="hidden sm:inline">Affiliate</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
