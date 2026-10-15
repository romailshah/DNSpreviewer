import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200/60 bg-white mt-24">
      <div className="container-wide pt-10 pb-6 text-sm text-ink-500 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} DNS Previewer</span>
          <span className="chip-free">Free forever</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href="/how-it-works" className="hover:text-ink-900">How it works</Link>
          <Link href="/blog" className="hover:text-ink-900">Blog</Link>
          <Link href="/vs-skipdns" className="hover:text-ink-900">SkipDNS alternative</Link>
          <Link href="/faq" className="hover:text-ink-900">FAQ</Link>
          <Link href="?feedback=idea" scroll={false} className="hover:text-ink-900">Feedback</Link>
          <Link href="/abuse" className="hover:text-ink-900">Report abuse</Link>
          <Link href="/affiliate-disclosure" className="hover:text-ink-900">Affiliate disclosure</Link>
        </nav>
      </div>
      <div className="container-wide border-t border-ink-200/50 py-5 text-xs text-ink-500">
        DNS Previewer is a product of{" "}
        <a
          href="https://webnrank.com/"
          target="_blank"
          rel="noopener"
          className="font-semibold text-ink-700 underline underline-offset-2 hover:text-brand-600"
        >
          Web &amp; Rank LTD
        </a>
        .
      </div>
    </footer>
  );
}
