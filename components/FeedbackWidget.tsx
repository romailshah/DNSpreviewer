"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Floating "Help & feedback" button on every site page (not /admin).
 *
 * - Opens a small panel: bottom sheet on phones, card above the button on
 *   larger screens. Messages land in /admin/feedback.
 * - `?feedback=problem|idea|question` in the URL opens it pre-set, so error
 *   pages and footer links can deep-link into it.
 * - On a "preview ready" page (/s/:id) it nudges once per browser after a
 *   short delay, since that's when people find out whether it worked.
 */

type Kind = "problem" | "idea" | "question" | "help";

const KINDS: Array<{ id: Kind; label: string; placeholder: string; icon: ReactNode }> = [
  {
    id: "problem",
    label: "Something's broken",
    placeholder: "What happened? The domain and server IP you used help me track it down.",
    icon: <BugIcon />,
  },
  {
    id: "idea",
    label: "Idea",
    placeholder: "What would make DNS Previewer better for you?",
    icon: <BulbIcon />,
  },
  {
    id: "question",
    label: "Question",
    placeholder: "Ask away. No question is too small.",
    icon: <QuestionIcon />,
  },
  {
    id: "help",
    label: "Migrate it for me",
    placeholder:
      "What are you moving? The platform, roughly how big the site is, and where it's going from and to. I'll reply with a fixed quote.",
    icon: <BoxIcon />,
  },
];

const NUDGE_KEY = "dnsp_feedback_nudged";
const NUDGE_DELAY_MS = 40_000;

export function FeedbackWidget() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [kind, setKind] = useState<Kind>("problem");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hidden = pathname.startsWith("/admin");

  const openWith = useCallback((k?: Kind) => {
    if (k) setKind(k);
    setNudge(false);
    setOpen(true);
  }, []);

  // Deep link: ?feedback=problem opens the panel, then the param is removed.
  useEffect(() => {
    const k = searchParams?.get("feedback");
    if (!k) return;
    openWith(KINDS.some((x) => x.id === k) ? (k as Kind) : undefined);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("feedback");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router, openWith]);

  // Who's signed in, so we don't ask for an email we already have.
  useEffect(() => {
    if (!open || userEmail !== null) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: { user: { email: string } | null }) => setUserEmail(d.user?.email ?? ""))
      .catch(() => setUserEmail(""));
  }, [open, userEmail]);

  // One gentle nudge on the preview-ready page.
  useEffect(() => {
    if (!pathname.startsWith("/s/")) return;
    let seen = false;
    try {
      seen = localStorage.getItem(NUDGE_KEY) === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => {
      setNudge(true);
      try {
        localStorage.setItem(NUDGE_KEY, "1");
      } catch {}
    }, NUDGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  function close() {
    setOpen(false);
    if (sentTo !== undefined) {
      // Reset after a successful send so the next open starts fresh.
      setTimeout(() => {
        setSentTo(undefined);
        setMessage("");
      }, 200);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message,
          email: userEmail ? "" : email,
          page: typeof window !== "undefined" ? window.location.pathname : pathname,
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Couldn't send that. Try again in a moment.");
        return;
      }
      setSentTo(userEmail || email || null);
    } catch {
      setError("Couldn't send that. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (hidden) return null;

  const current = KINDS.find((k) => k.id === kind)!;

  return (
    <>
      {/* Nudge bubble */}
      {nudge && !open && (
        <div className="fixed bottom-20 right-4 z-50 w-[260px] rounded-2xl border border-ink-200 bg-white p-4 shadow-soft animate-[fb-in_.25s_ease-out]">
          <button
            type="button"
            onClick={() => setNudge(false)}
            className="absolute right-2 top-2 rounded-md p-1 text-ink-500 hover:bg-ink-100"
            aria-label="Dismiss"
          >
            <CloseIcon />
          </button>
          <p className="pr-5 text-sm font-semibold text-ink-900">How&rsquo;s the preview looking?</p>
          <p className="mt-1 text-sm text-ink-700">If anything&rsquo;s off, tell me and I&rsquo;ll look into it.</p>
          <button
            type="button"
            onClick={() => openWith("problem")}
            className="mt-3 text-sm font-semibold text-brand-600 hover:underline"
          >
            Report an issue
          </button>
        </div>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={() => (open ? close() : openWith())}
        aria-label={open ? "Close feedback" : "Help & feedback"}
        className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-ink-900 p-3.5 sm:px-4 sm:py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2"
        aria-expanded={open}
        aria-controls="feedback-panel"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
        <span className="sr-only sm:not-sr-only">{open ? "Close" : "Help & feedback"}</span>
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-ink-900/30 sm:hidden" onClick={close} aria-hidden="true" />
      )}

      {/* Panel */}
      {open && (
        <div
          id="feedback-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="feedback-title"
          className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border border-ink-200 bg-white shadow-soft animate-[fb-up_.25s_ease-out] sm:inset-x-auto sm:bottom-20 sm:right-4 sm:w-[380px] sm:rounded-3xl sm:animate-[fb-in_.2s_ease-out]"
        >
          {/* Header */}
          <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-brand-500 to-brand-600 px-5 pb-5 pt-5 text-white">
            <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/40 sm:hidden" aria-hidden="true" />
            <button
              type="button"
              onClick={close}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
            <div className="relative flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-display text-sm font-bold text-brand-600">
                RS
              </span>
              <div>
                <p id="feedback-title" className="font-display text-lg font-bold leading-tight">
                  How can I help?
                </p>
                <p className="text-sm text-white/85">
                  {kind === "help"
                    ? "Romail here. I migrate client sites for a living."
                    : "Romail here. I read every message myself."}
                </p>
              </div>
            </div>
          </div>

          {sentTo !== undefined ? (
            <div className="px-5 py-8 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckIcon />
              </span>
              <p className="mt-3 font-display text-lg font-semibold text-ink-900">Thanks, got it.</p>
              <p className="mt-1 text-sm text-ink-700">
                {sentTo ? (
                  <>
                    I&rsquo;ll reply to <span className="font-medium text-ink-900 break-all">{sentTo}</span>.
                  </>
                ) : (
                  "Leave your email next time if you'd like a reply."
                )}
              </p>
              <button type="button" onClick={close} className="btn-ghost mt-5">
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="What's this about?">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    role="radio"
                    aria-checked={kind === k.id}
                    onClick={() => setKind(k.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold leading-tight transition ${
                      kind === k.id
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-ink-200 text-ink-700 hover:border-brand-200 hover:bg-cream"
                    }`}
                  >
                    {k.icon}
                    <span className="text-center">{k.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="feedback-message" className="sr-only">
                  Your message
                </label>
                <textarea
                  id="feedback-message"
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={current.placeholder}
                  rows={4}
                  required
                  minLength={5}
                  maxLength={4000}
                  className="input resize-none text-sm"
                />
              </div>

              {userEmail ? (
                <p className="text-xs text-ink-500">
                  I&rsquo;ll reply to <span className="font-medium text-ink-700 break-all">{userEmail}</span>
                </p>
              ) : (
                <div>
                  <label htmlFor="feedback-email" className="block text-xs font-semibold text-ink-700">
                    Your email{" "}
                    <span className="font-normal text-ink-500">
                      {kind === "help" ? "(so I can send the quote)" : "(optional, so I can reply)"}
                    </span>
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required={kind === "help"}
                    className="input mt-1.5 text-sm"
                  />
                </div>
              )}

              {/* Honeypot, hidden from people and screen readers */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button type="submit" disabled={sending || message.trim().length < 5} className="btn-primary w-full">
                {sending ? "Sending..." : "Send message"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
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

function ChatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps} width={24} height={24} strokeWidth={2.5}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function BugIcon() {
  return (
    <svg {...iconProps}>
      <rect x="7" y="7" width="10" height="13" rx="5" />
      <path d="M12 11v9M7 12H3M21 12h-4M7 17l-3 2M17 17l3 2M8.5 7.5L7 4M15.5 7.5L17 4" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 3.5M12 17h.01" />
    </svg>
  );
}
