import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";

export const metadata = { title: "How it works — DNS Previewer" };

export default function HowItWorks() {
  return (
    <>
      <SiteHeader />
      <main className="container-narrow py-8 sm:py-14">
        <span className="chip">How it works</span>
        <h1 className="heading mt-4 text-2xl sm:text-3xl md:text-4xl text-ink-900">
          How DNS Previewer works
        </h1>
        <p className="mt-4 text-sm sm:text-base text-ink-700 leading-relaxed">
          When you migrate a site to a new host, your domain still points to the old server until
          you update DNS. That&rsquo;s a problem: you can&rsquo;t easily test the new host under its
          real domain, and a botched switchover is visible to every visitor.
        </p>

        <h2 className="heading mt-8 sm:mt-10 text-lg sm:text-xl md:text-2xl text-ink-900">The standard workarounds — and why they hurt</h2>
        <ul className="mt-3 list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-ink-700 leading-relaxed">
          <li><strong className="text-ink-900">Editing /etc/hosts:</strong> only works on your machine. Can&rsquo;t share with clients or QA.</li>
          <li><strong className="text-ink-900">Using the server&rsquo;s IP directly:</strong> wrong Host header, SSL cert errors, broken vhosts.</li>
          <li><strong className="text-ink-900">Staging subdomain:</strong> often has a different code path than production, so issues slip through.</li>
        </ul>

        <h2 className="heading mt-8 sm:mt-10 text-lg sm:text-xl md:text-2xl text-ink-900">What DNS Previewer does</h2>
        <ol className="mt-3 list-decimal pl-5 sm:pl-6 space-y-3 text-sm sm:text-base text-ink-700 leading-relaxed">
          <li>
            You tell us your domain (<code>example.com</code>) and the new server&rsquo;s IP or hostname.
          </li>
          <li>
            We generate a short subdomain like <code>a7xk2p.dnspreviewer.com</code> and open a
            reverse proxy on it.
          </li>
          <li>
            When you visit that URL, our proxy connects to your target server using the correct{" "}
            <code>Host</code> header and TLS SNI for your domain — so your server serves the right
            vhost and content.
          </li>
          <li>
            Responses are streamed back to your browser. HTML and CSS that reference your domain
            are rewritten to the preview URL so clicks and assets keep working inside the preview.
          </li>
          <li>
            After 15 minutes the session expires and the URL returns a friendly expired page.
          </li>
        </ol>

        <h2 className="heading mt-8 sm:mt-10 text-lg sm:text-xl md:text-2xl text-ink-900">What&rsquo;s stripped or rewritten</h2>
        <ul className="mt-3 list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-ink-700 leading-relaxed break-words">
          <li><code>X-Frame-Options</code>, <code>Content-Security-Policy</code>, and <code>Strict-Transport-Security</code> headers are removed so the preview can load.</li>
          <li><code>Set-Cookie</code> domain attributes are removed so cookies bind to the preview subdomain.</li>
          <li><code>Location</code> redirects to your domain are rewritten to stay inside the preview.</li>
          <li>Response bodies are decompressed before rewriting (we ask upstream for identity encoding).</li>
        </ul>

        <h2 className="heading mt-8 sm:mt-10 text-lg sm:text-xl md:text-2xl text-ink-900">Known limitations</h2>
        <ul className="mt-3 list-disc pl-5 sm:pl-6 space-y-2 text-sm sm:text-base text-ink-700 leading-relaxed break-words">
          <li>JavaScript that hardcodes your apex domain in <code>fetch()</code>/<code>XMLHttpRequest</code> will hit CORS errors. This is inherent to any preview proxy.</li>
          <li>WebSockets are not proxied. Most apps fall back to long polling.</li>
          <li>Responses larger than 4&nbsp;MB pass through without link rewriting.</li>
          <li>Third-party services (OAuth, payment gateways) may not accept requests that originated from a subdomain they don&rsquo;t recognize.</li>
        </ul>

        <p className="mt-8 sm:mt-10">
          <Link href="/create" className="btn-primary">Try it now</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
