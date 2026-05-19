"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Protocol = "https" | "http" | "both";
type SiteType = "regular" | "wildcard" | "subdomain";

export function CreateForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [domain, setDomain] = useState("");
  const [target, setTarget] = useState("");
  const [protocol, setProtocol] = useState<Protocol>("https");
  const [port, setPort] = useState("");
  const [siteType, setSiteType] = useState<SiteType>("regular");
  const [subdomain, setSubdomain] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [noExpiry, setNoExpiry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        domain: domain.trim(),
        target: target.trim(),
        protocol,
        siteType,
      };
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
        return;
      }
      router.push(`/s/${data.id}`);
    } catch (err) {
      setError((err as Error).message || "Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-6">
      {!isLoggedIn && (
        <div className="flex items-start gap-3 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-brand-800">
          <span>💡</span>
          <div>
            You&rsquo;re creating as a guest.{" "}
            <Link href="/signup" className="font-semibold underline decoration-brand-300 underline-offset-2">
              Sign up free
            </Link>{" "}
            to save links to a dashboard and unlock password-protected & no-expiry previews.
          </div>
        </div>
      )}

      <Field
        label="Custom link label"
        hint="Optional — a friendly name shown in your dashboard."
        id="label"
      >
        <input
          id="label"
          className="input"
          placeholder="e.g. Client site — pre-migration QA"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={80}
        />
      </Field>

      <Field
        label="Your domain"
        hint="The domain you're migrating. No http://, no path."
        id="domain"
        required
      >
        <input
          id="domain"
          className="input"
          placeholder="example.com"
          autoComplete="off"
          spellCheck={false}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          required
        />
      </Field>

      <Field
        label="New server (IP or hostname)"
        hint="Public IPs only — private / loopback addresses are rejected."
        id="target"
        required
      >
        <input
          id="target"
          className="input"
          placeholder="203.0.113.42 or new.example.com"
          autoComplete="off"
          spellCheck={false}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          required
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Protocol" id="protocol" hint="How we talk to your server.">
          <select
            id="protocol"
            className="input"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value as Protocol)}
          >
            <option value="https">HTTPS (Flexible SSL)</option>
            <option value="http">HTTP Only</option>
            <option value="both">Both HTTP + HTTPS (auto-fallback)</option>
          </select>
        </Field>

        <Field label="Port" hint="Optional. Defaults to 80 / 443." id="port">
          <input
            id="port"
            className="input"
            placeholder="auto"
            inputMode="numeric"
            value={port}
            onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Site type" id="siteType">
          <select
            id="siteType"
            className="input"
            value={siteType}
            onChange={(e) => setSiteType(e.target.value as SiteType)}
          >
            <option value="regular">Regular website</option>
            <option value="wildcard">Wildcard / Multisite</option>
            <option value="subdomain">Specific subdomain</option>
          </select>
        </Field>

        {siteType === "subdomain" && (
          <Field label="Subdomain" id="sub" hint="e.g. 'blog' for blog.example.com" required>
            <input
              id="sub"
              className="input"
              placeholder="blog"
              spellCheck={false}
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
            />
          </Field>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-ink-200 bg-ink-50/50 p-5">
        <ToggleRow
          on={passwordEnabled}
          onChange={setPasswordEnabled}
          title="🔒 Password-protect this preview"
          hint={isLoggedIn ? "Only people with the password can load it." : "Sign up free to enable."}
          disabled={!isLoggedIn}
        />
        {passwordEnabled && (
          <input
            type="password"
            className="input"
            placeholder="Preview password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={passwordEnabled}
            autoComplete="new-password"
          />
        )}

        <ToggleRow
          on={noExpiry}
          onChange={setNoExpiry}
          title="♾️ No expiry"
          hint={
            isLoggedIn
              ? "Stays active until you deactivate it in your dashboard."
              : "Sign up free to enable."
          }
          disabled={!isLoggedIn}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-ink-500 max-w-xs">
          By creating a preview you confirm you control this domain or have permission to test it.
        </p>
        <button className="btn-primary" disabled={loading || !domain || !target}>
          {loading ? "Creating…" : "Create preview"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  id,
  required,
  children,
}: {
  label: string;
  hint?: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink-900">
        {label}
        {required && <span className="text-brand-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function ToggleRow({
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
    <label className={`flex items-start gap-4 ${disabled ? "opacity-60" : ""}`}>
      <button
        type="button"
        role="switch"
        aria-checked={on && !disabled}
        disabled={disabled}
        onClick={() => !disabled && onChange(!on)}
        className="toggle"
        data-on={on && !disabled}
      >
        <span />
      </button>
      <div className="flex-1">
        <div className="font-semibold text-sm text-ink-900">{title}</div>
        {hint && <div className="text-xs text-ink-500 mt-0.5">{hint}</div>}
      </div>
    </label>
  );
}
