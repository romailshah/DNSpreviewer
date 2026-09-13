import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Top-of-page explainer for /how-it-works: the migration steps without DNS
 * Previewer next to the same migration with it. Built from HTML rather than
 * an image so it reflows on mobile and stays readable text for search
 * engines and LLMs.
 */
export function HowItWorksDiagram() {
  return (
    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
      <Panel tone="without">
        <Step n={1} title="Copy your site to the new server">
          Files, database and SSL certificate.
        </Step>
        <Step n={2} title="Switch DNS and hope">
          There&rsquo;s no easy way to see the new server under your real domain first.
        </Step>
        <Step n={3} title="Wait for DNS to update">
          Often hours, depending on the TTL on your DNS record.
        </Step>
        <Step n={4} title="Find the problems live" warn last>
          Broken pages, SSL errors or a missing database show up in front of real visitors.
        </Step>
        <Outcome tone="without">
          Rolling back means another DNS change, and another wait.
        </Outcome>
      </Panel>

      <Panel tone="with">
        <Step n={1} title="Copy your site to the new server" brand>
          Same as before. Your live site stays exactly where it is.
        </Step>
        <Step n={2} title="Generate a preview link" brand>
          Enter your domain and the new server&rsquo;s IP address on DNS Previewer.
        </Step>
        <Step n={3} title="Check it in your browser" brand>
          The link loads your site from the new server under your real domain. Send it to your
          client or open it on your phone.
        </Step>
        <Step n={4} title="Everything works? Switch DNS" brand done last>
          You already know the new server is ready, so there&rsquo;s nothing to find out live.
        </Step>
        <Outcome tone="with">
          Visitors go straight from the old site to a working new one.
          <Link href="/" className="btn-primary mt-4 w-full sm:w-auto">
            Generate a preview link
          </Link>
        </Outcome>
      </Panel>
    </div>
  );
}

type PanelTone = "without" | "with";

function Panel({ tone, children }: { tone: PanelTone; children: ReactNode }) {
  const isWith = tone === "with";
  return (
    <section
      className={`flex flex-col rounded-2xl sm:rounded-3xl border p-5 sm:p-7 ${
        isWith ? "border-brand-200 bg-white shadow-glow" : "border-ink-200 bg-ink-50"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
            isWith ? "bg-brand-500 text-white" : "bg-ink-200 text-ink-700"
          }`}
          aria-hidden="true"
        >
          {isWith ? <CheckIcon /> : <CrossIcon />}
        </span>
        <h2 className={`heading text-lg sm:text-xl ${isWith ? "text-ink-900" : "text-ink-700"}`}>
          {isWith ? "With DNS Previewer" : "Without DNS Previewer"}
        </h2>
      </div>
      <ol className="mt-6 flex-1">{children}</ol>
    </section>
  );
}

function Step({
  n,
  title,
  children,
  brand,
  warn,
  done,
  last,
}: {
  n: number;
  title: string;
  children: ReactNode;
  brand?: boolean;
  warn?: boolean;
  done?: boolean;
  last?: boolean;
}) {
  const marker = warn
    ? "bg-red-50 text-red-600 border-red-200"
    : done
      ? "bg-brand-500 text-white border-brand-500"
      : brand
        ? "bg-brand-50 text-brand-700 border-brand-200"
        : "bg-white text-ink-500 border-ink-200";
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && (
        <span
          className={`absolute left-[15px] top-9 bottom-1 w-0.5 ${brand ? "bg-brand-200" : "bg-ink-200"}`}
          aria-hidden="true"
        />
      )}
      <span
        className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold ${marker}`}
      >
        {warn ? <WarnIcon /> : done ? <CheckIcon /> : n}
      </span>
      <div className="pt-1">
        <h3 className={`font-display font-semibold ${warn ? "text-red-700" : "text-ink-900"}`}>{title}</h3>
        <p className={`mt-1 text-sm leading-relaxed ${brand ? "text-ink-700" : "text-ink-500"}`}>{children}</p>
      </div>
    </li>
  );
}

function Outcome({ tone, children }: { tone: PanelTone; children: ReactNode }) {
  const isWith = tone === "with";
  return (
    <div
      className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium ${
        isWith ? "bg-brand-50 text-brand-800" : "bg-white text-ink-700 border border-ink-200"
      }`}
    >
      <div className="flex flex-col items-start">{children}</div>
    </div>
  );
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg {...iconProps}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 8v5M12 16.5h.01" />
    </svg>
  );
}
