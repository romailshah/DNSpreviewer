"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
}: {
  isLoggedIn: boolean;
  rootDomain: string;
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
      setStep("Ready — redirecting…");
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

          <div className="space-y-3 rounded-xl border border-ink-200 bg-ink-50/50 p-4">
            <MiniToggle
              on={passwordEnabled}
              onChange={setPasswordEnabled}
              title="🔒 Password-protect this preview"
              hint={
                isLoggedIn
                  ? "Only people with the password can load it."
                  : "Sign up free to enable."
              }
              disabled={!isLoggedIn}
            />
            {passwordEnabled && (
              <input
                type="password"
                className="input"
                placeholder="Preview password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            )}
            <MiniToggle
              on={noExpiry}
              onChange={setNoExpiry}
              title="♾️ No expiry"
              hint={
                isLoggedIn
                  ? "Stays active until you deactivate it."
                  : "Sign up free to enable."
              }
              disabled={!isLoggedIn}
            />
          </div>
        </div>
      )}

      {/* Footer meta */}
      <p className="mt-5 text-xs text-ink-500 text-center">
        {isLoggedIn ? (
          <>Logged in — your preview saves to your dashboard.</>
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

function MiniToggle({
  on,
  onChange,
  title,
  hint,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? "opacity-60" : ""}`}>
      <button
        type="button"
        role="switch"
        aria-checked={on && !disabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!on)}
        className="toggle mt-0.5"
        data-on={on && !disabled}
      >
        <span />
      </button>
      <div className="flex-1">
        <div className="font-semibold text-sm text-ink-900">{title}</div>
        {hint && <div className="text-[11px] text-ink-500 mt-0.5">{hint}</div>}
      </div>
    </label>
  );
}
