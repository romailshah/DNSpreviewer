import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSessionRaw } from "@/lib/sessions";
import { ROOT_DOMAIN } from "@/lib/env";
import { SessionStatus } from "@/components/SessionStatus";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getSessionRaw(id);
  if (!s) notFound();

  const previewHost = `${s.id}.${ROOT_DOMAIN}`;
  const previewUrl =
    ROOT_DOMAIN === "localhost"
      ? `http://${previewHost}:3000/`
      : `https://${previewHost}/`;

  const expired = s.expiresAt !== null && s.expiresAt < Date.now();

  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-8 sm:py-14">
        <span className={expired ? "chip" : "chip-free"}>
          {s.disabled ? "Disabled" : expired ? "Expired" : "Preview ready"}
        </span>
        <h1 className="heading mt-4 text-2xl sm:text-3xl md:text-4xl text-ink-900 break-words">
          {s.label || "Your preview link"}
        </h1>
        <p className="mt-2 text-ink-700 text-sm sm:text-base break-all">
          <code>{s.domain}</code> served from <code>{s.target}</code>
          {s.siteType === "wildcard" && " · wildcard / multisite"}
          {s.siteType === "subdomain" && ` · subdomain ${s.subdomain}`}
          {s.passwordHash ? " · 🔒 password-protected" : ""}
        </p>

        <div className="mt-6 sm:mt-8 card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink-500">Preview URL</div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block font-mono text-brand-600 hover:underline break-all text-sm sm:text-base"
              >
                {previewUrl}
              </a>
            </div>
            <a href={previewUrl} target="_blank" rel="noreferrer" className="btn-primary sm:shrink-0 w-full sm:w-auto text-center">
              Open
            </a>
          </div>
        </div>

        <SessionStatus
          id={s.id}
          expiresAt={s.expiresAt}
          previewUrl={previewUrl}
          noExpiry={s.expiresAt === null}
        />

        <div className="mt-8 sm:mt-10 card">
          <h2 className="font-display font-semibold text-ink-900">Troubleshooting</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700 list-disc pl-5">
            <li>Page blank or &ldquo;upstream error&rdquo;? Your server may not be listening on the selected protocol. Try <strong>Both HTTP+HTTPS</strong> for auto-fallback.</li>
            <li>Login broken? Many apps pin session cookies to your exact domain — inherent to any preview proxy.</li>
            <li>Assets from external CDNs (fonts, analytics) load directly from their origin.</li>
          </ul>
        </div>

        <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-2">
          <Link href="/create" className="btn-ghost">Create another</Link>
          <Link href="/dashboard" className="btn-text">Back to dashboard &rarr;</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
