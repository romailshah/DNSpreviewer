"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Slim bar above the header that alternates between the two offers: the
 * done-for-you migration service and the Hostinger affiliate code.
 *
 * - Not sticky, so it scrolls away and the header stays compact.
 * - Rendered on the server so it doesn't pop in and push the page down
 *   (layout shift hurts Core Web Vitals). Only people who dismissed it see
 *   it disappear after load.
 * - A thin progress line shows when the next message is coming; hovering
 *   pauses both the line and the rotation. Reduced-motion users get no
 *   rotation and no animation.
 * - Hidden in /admin, and dismissible for 7 days per browser.
 * - The affiliate message always shows an "Affiliate" label, on phones too,
 *   and links with rel="sponsored"; the full disclosure sits on the cards.
 */

const DISMISS_KEY = "dnsp_promobar_dismissed_until";
const ROTATE_MS = 6000;
const SLIDES = 2;

export function PromoBar() {
  const pathname = usePathname() ?? "/";
  const [hidden, setHidden] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let until = 0;
    try {
      until = Number(localStorage.getItem(DISMISS_KEY) || 0);
    } catch {}
    if (until > Date.now()) setHidden(true);
    setReducedMotion(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (hidden || pathname.startsWith("/admin")) return null;

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    } catch {}
  }

  const next = () => setIndex((i) => (i + 1) % SLIDES);

  return (
    <div
      className="relative bg-ink-900 text-white text-xs sm:text-[13px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Offers"
    >
      <div className="flex h-9 items-center">
        {/* Spacer the same width as the close button keeps the text centred. */}
        <span className="w-9 shrink-0" aria-hidden="true" />

        <div className="flex min-w-0 flex-1 justify-center">
          {index === 0 ? (
            <p key="hire" className="flex min-w-0 items-center gap-2 animate-[fb-in_.3s_ease-out]">
              <span className="hidden sm:inline rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Done for you
              </span>
              <span className="truncate">
                <span className="sm:hidden">Migration stuck? We&rsquo;ll do it for you.</span>
                <span className="hidden sm:inline">Migration not going to plan? We&rsquo;ll move the site for you.</span>
              </span>
              <Link
                href="?feedback=help"
                scroll={false}
                className="shrink-0 font-semibold text-brand-400 hover:text-brand-300 underline-offset-2 hover:underline"
              >
                <span className="sm:hidden">Quote &rarr;</span>
                <span className="hidden sm:inline">Get a quote &rarr;</span>
              </Link>
            </p>
          ) : (
            <p key="host" className="flex min-w-0 items-center gap-2 animate-[fb-in_.3s_ease-out]">
              <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/70">
                Affiliate
              </span>
              <span className="truncate">
                {/* Full line where there's room, shorter on tablets and phones. */}
                <span className="hidden lg:inline">
                  Moving hosts? We put client sites on Hostinger&reg; hosting. Code{" "}
                  <span className="font-mono font-bold">ROMAILSHAH</span> gets you extra off at checkout.
                </span>
                <span className="hidden sm:inline lg:hidden">
                  Our pick: Hostinger&reg; hosting, code <span className="font-mono font-bold">ROMAILSHAH</span> for
                  extra off
                </span>
                <span className="sm:hidden">
                  Hostinger&reg; code <span className="font-mono font-bold">ROMAILSHAH</span>
                </span>
              </span>
              <a
                href="/go/hostinger?src=top-bar"
                target="_blank"
                rel="sponsored nofollow noopener"
                className="shrink-0 font-semibold text-brand-400 hover:text-brand-300 underline-offset-2 hover:underline"
              >
                <span className="sm:hidden">Plans &rarr;</span>
                <span className="hidden sm:inline">See plans &rarr;</span>
              </a>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-white/50 hover:text-white"
          aria-label="Hide these offers for a week"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Progress line. Its animation end drives the rotation, so the line
          and the slide change can never drift apart, and pausing the
          animation on hover pauses the rotation with it. */}
      {!reducedMotion && (
        <span
          key={index}
          className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-brand-500"
          style={{
            animation: `promo-progress ${ROTATE_MS}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }}
          onAnimationEnd={next}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
