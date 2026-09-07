"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Turnstile } from "./Turnstile";

type Protocol = "https" | "http" | "both";
type SiteType = "regular" | "wildcard" | "subdomain";

const SAMPLE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function randomSampleId(): string {
  let s = "";
  for (let i = 0; i < 10; i++) {
    s += SAMPLE_ALPHABET.charAt(Math.floor(Math.random() * SAMPLE_ALPHABET.length));
  }
  return s;
}

/**
 * Strip noise from a pasted URL/host — protocol, path, trailing slash, query.
 * If a `:port` is present, return it separately so we can auto-populate the port field.
 */
function cleanHost(raw: string): { clean: string; port?: string; wasDirty: boolean } {
  const original = raw.trim();
  let v = original.toLowerCase();
  v = v.replace(/^https?:\/\//, "").replace(/^\/\//, "");
  v = v.split("/")[0].split("?")[0].split("#")[0];
  let port: string | undefined;
  const colon = v.indexOf(":");
  if (colon > 0) {
    port = v.slice(colon + 1).replace(/[^0-9]/g, "");
    v = v.slice(0, colon);
  }
  v = v.replace(/[^a-z0-9.-]/g, "");
  return { clean: v, port, wasDirty: v !== original.toLowerCase() || !!port };
}

function looksLikeDomain(d: string): boolean {
  if (!d) return false;
  return /^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/.test(d);
}

function looksLikeIp(s: string): boolean {
  return /^(\d{1,3})(\.\d{1,3}){3}$/.test(s);
}

export function HeroPreviewForm({
  isLoggedIn,
  rootDomain,
  turnstileSiteKey,
  ttlMinutes,
}: {
  isLoggedIn: boolean;
  rootDomain: string;
  turnstileSiteKey: string;
  ttlMinutes: number;
}) {
  const router = useRouter();

  // Core inputs
  const [domain, setDomain] = useState("");
  const [target, setTarget] = useState("");
  const [domainHint, setDomainHint] = useState<string | null>(null);
  const [targetHint, setTargetHint] = useState<string | null>(null);

  // Advanced
  const [advanced, setAdvanced] = useState(false);
  const [label, setLabel] = useState("");
  const [protocol, setProtocol] = useState<Protocol>("https");
  const [port, setPort] = useState("");
  const [siteType, setSiteType] = useState<SiteType>("regular");
  const [subdomain, setSubdomain] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [noExpiry, setNoExpiry] = useState(false);

  // Submission
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [needsAccount, setNeedsAccount] = useState(false);

  // Sample preview ID for the live URL indicator (stable per mount — no hydration mismatch)
  const [sampleId, setSampleId] = useState("xxxxxxxxxx");
  useEffect(() => {
    setSampleId(randomSampleId());
  }, []);

  const domainValid = looksLikeDomain(domain);
  const targetValid = looksLikeIp(target) || looksLikeDomain(target);
  const bothValid = domainValid && targetValid;

  function onDomainChange(raw: string) {
    const { clean, port: inferredPort, wasDirty } = cleanHost(raw);
    setDomain(clean);
    setDomainHint(wasDirty ? "Cleaned up automatically" : null);
    if (inferredPort) {
      setPort(inferredPort);
      setAdvanced(true);
    }
  }

  function onTargetChange(raw: string) {
    const { clean, port: inferredPort, wasDirty } = cleanHost(raw);
    setTarget(clean);
    setTargetHint(wasDirty ? "Cleaned up automatically" : null);
    if (inferredPort) {
      setPort(inferredPort);
      setAdvanced(true);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bothValid) return;
    setError(null);
    setLoading(true);
    setStep("Creating preview…");
    try {
      const body: Record<string, unknown> = { domain, target, protocol, siteType };
      if (label.trim()) body.label = label.trim();
      if (port.trim()) body.port = Number(port);
      if (siteType === "subdomain" && subdomain.trim()) body.subdomain = subdomain.trim();
      if (passwordEnabled && password) body.password = password;
      if (noExpiry) body.noExpiry = true;
      if (captchaToken) body.turnstileToken = captchaToken;

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.message ||
          (data?.issues?.fieldErrors &&
            Object.values(data.issues.fieldErrors).flat().join(", ")) ||
          "Something went wrong.";
        setError(String(msg));
        setLoading(false);
        setStep("");
        return;
      }
      setStep("Ready, redirecting…");
      router.push(`/s/${data.id}`);
    } catch (err) {
      setError((err as Error).message || "Network error");
      setLoading(false);
      setStep("");
    }
  }

  const livePreviewId = bothValid ? sampleId : "xxxxxxxxxx";

  return (
    <form onSubmit={onSubmit} className="mt-8 sm:mt-12 mx-auto max-w-3xl text-left">
      {/* Main card */}
      <div className="relative rounded-2xl bg-white/90 backdrop-blur border border-brand-100 shadow-glow p-4 sm:p-5">
        {/* Inputs + arrow */}
        <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-stretch">
          <FieldSlot
            label="Your domain"
            valid={domainValid}
            hint={domainHint}
          >
            <input
              className="input pr-10"
              placeholder="example.com"
              autoComplete="off"
              spellCheck={false}
              value={domain}
              onChange={(e) => onDomainChange(e.target.value)}
              aria-label="Your domain"
            />
          </FieldSlot>

          <div className="flex items-center justify-center sm:pb-7">
            <Arrow active={bothValid} />
          </div>

          <FieldSlot
            label="New server IP or hostname"
            valid={targetValid}
            hint={targetHint}
          >
            <input
              className="input pr-10"
              placeholder="203.0.113.42"
              autoComplete="off"
              spellCheck={false}
              value={target}
              onChange={(e) => onTargetChange(e.target.value)}
              aria-label="New server IP or hostname"
            />
          </FieldSlot>
        </div>


        {/* Above-the-fold options.
            These were behind "advanced options" before, which buried the two
            things that actually differentiate us from the paid tools. Both are
            account-only server side, so a logged-out visitor gets an honest
            prompt to sign up rather than a control that fails on submit. */}
        <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <InlineOption
              on={passwordEnabled}
              locked={!isLoggedIn}
              label="Password protect"
              icon="🔒"
              onChange={(v) => {
                if (!isLoggedIn) {
                  setNeedsAccount(true);
                  return;
                }
                setPasswordEnabled(v);
              }}
            />
            <InlineOption
              on={noExpiry}
              locked={!isLoggedIn}
              label="No expiry"
              icon="♾️"
              onChange={(v) => {
                if (!isLoggedIn) {
                  setNeedsAccount(true);
                  return;
                }
                setNoExpiry(v);
              }}
            />
            {!passwordEnabled && !noExpiry && !needsAccount && (
              <span className="text-[11px] text-ink-500 ml-auto">
                Otherwise your link expires in {ttlMinutes} minutes
              </span>
            )}
          </div>

          {passwordEnabled && isLoggedIn && (
            <input
              type="password"
              className="input mt-2"
              placeholder="Password for this preview"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          )}

          {needsAccount && !isLoggedIn && (
            <p className="mt-2 text-xs text-ink-600">
              Both of these need a free account.{" "}
              <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
                Sign up free
              </Link>{" "}
              to unlock them. No card, no paid tier, they stay free.
            </p>
          )}
        </div>
        {/* Live preview + submit */}
        <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs sm:text-sm text-ink-600 min-w-0 truncate">
            <span className="text-ink-500">Your preview URL:</span>{" "}
            <code
              className={`!bg-brand-50 !text-brand-700 transition-opacity text-[11px] sm:text-xs ${
                bothValid ? "opacity-100" : "opacity-60"
              }`}
            >
              {livePreviewId}.{rootDomain}
            </code>
          </div>
          <button
            type="submit"
            className="btn-primary text-sm sm:text-base !px-5 sm:!px-7 !py-3 w-full sm:w-auto"
            disabled={loading || !bothValid}
          >
            {loading ? (
              <>
                <Spinner />
                {step || "Creating…"}
              </>
            ) : (
              <>Generate my preview →</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Advanced toggle */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          className="text-sm font-semibold text-ink-700 hover:text-brand-600 transition inline-flex items-center gap-1.5"
          aria-expanded={advanced}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className={`transition-transform ${advanced ? "rotate-90" : ""}`}
            aria-hidden
          >
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {advanced ? "Hide advanced options" : "Custom label, password, wildcard & more"}
        </button>
      </div>

      {advanced && (
        <div className="mt-4 rounded-2xl border border-ink-200 bg-white p-5 space-y-4 shadow-soft">
          <div className="grid sm:grid-cols-2 gap-4">
            <MiniField label="Label" hint="Optional friendly name.">
              <input
                className="input"
                placeholder="e.g. Client migration QA"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={80}
              />
            </MiniField>
            <MiniField label="Site type">
              <select
                className="input"
                value={siteType}
                onChange={(e) => setSiteType(e.target.value as SiteType)}
              >
                <option value="regular">Regular website</option>
                <option value="wildcard">Wildcard / multisite</option>
                <option value="subdomain">Specific subdomain</option>
              </select>
            </MiniField>
          </div>

          {siteType === "subdomain" && (
            <MiniField label="Subdomain" hint="e.g. 'blog' for blog.example.com">
              <input
                className="input"
                placeholder="blog"
                spellCheck={false}
                value={subdomain}
                onChange={(e) =>
                  setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
              />
            </MiniField>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <MiniField label="Protocol">
              <select
                className="input"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as Protocol)}
              >
                <option value="https">HTTPS (Flexible SSL)</option>
                <option value="http">HTTP only</option>
                <option value="both">Both (auto-fallback)</option>
              </select>
            </MiniField>
            <MiniField label="Port" hint="Defaults to 80 / 443.">
              <input
                className="input"
                placeholder="auto"
                inputMode="numeric"
                value={port}
                onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </MiniField>
          </div>

        </div>
      )}

      {!isLoggedIn && turnstileSiteKey && (
        <div className="mt-4 flex justify-center">
          <Turnstile siteKey={turnstileSiteKey} onToken={setCaptchaToken} />
        </div>
      )}

      {/* Footer meta */}
      <p className="mt-5 text-xs text-ink-500 text-center">
        {isLoggedIn ? (
          <>Logged in. Your preview saves to your dashboard.</>
        ) : (
          <>
            Creating as guest.{" "}
            <Link
              href="/signup"
              className="font-semibold text-brand-600 hover:underline"
            >
              Sign up free
            </Link>{" "}
            to save to a dashboard & unlock password / no-expiry.
          </>
        )}
      </p>
    </form>
  );
}

function FieldSlot({
  label,
  valid,
  hint,
  children,
}: {
  label: string;
  valid: boolean;
  hint: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-500 mb-1.5 px-1">
        {label}
      </span>
      <div className="relative">
        {children}
        {valid && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-emerald-500 text-white inline-flex items-center justify-center text-[11px] font-bold"
            aria-label="Valid"
          >
            ✓
          </span>
        )}
      </div>
      <div className="mt-1 h-4 text-[11px] text-ink-500 px-1">
        {hint && (
          <span className="inline-flex items-center gap-1 text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

function Arrow({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
        active
          ? "bg-brand-500 text-white shadow-glow scale-110"
          : "bg-ink-100 text-ink-400"
      }`}
      aria-hidden
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="hidden sm:block"
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="sm:hidden"
      >
        <path
          d="M12 5v14M6 13l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin mr-2 h-4 w-4 text-white inline"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-500 mb-1">
        {label}
      </span>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
    </label>
  );
}

/**
 * Compact chip toggle for the two headline options in the hero form.
 *
 * `locked` renders a visitor who is not signed in: the chip still responds to
 * a click so the intent is captured, but instead of switching on it surfaces
 * the signup prompt. Showing a dead disabled control here would hide the
 * feature we most want people to discover.
 */
/**
 * On/off switch for the two headline options in the hero form.
 *
 * Reuses the .toggle styles from globals.css so it matches the switches used
 * elsewhere in the app rather than inventing a second control.
 *
 * `locked` renders a visitor who is not signed in: the switch still responds
 * to a click so the intent is captured, but instead of flipping on it surfaces
 * the signup prompt. A dead disabled switch would hide the feature we most
 * want people to find.
 */
function InlineOption({
  on,
  locked,
  label,
  icon,
  onChange,
}: {
  on: boolean;
  locked?: boolean;
  label: string;
  icon: string;
  onChange: (v: boolean) => void;
}) {
  const active = on && !locked;
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={label}
        onClick={() => onChange(!on)}
        className="toggle"
        data-on={active}
      >
        <span />
      </button>
      <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
        <span aria-hidden="true">{icon}</span>
        <span className={`font-semibold ${active ? "text-brand-700" : "text-ink-800"}`}>
          {label}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-wide ${
          active ? "text-brand-600" : "text-ink-400"
        }`}>
          {active ? "On" : "Off"}
        </span>
        {locked && (
          <span className="text-[10px] font-medium text-ink-500">Free account</span>
        )}
      </span>
    </label>
  );
}
