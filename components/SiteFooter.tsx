import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200/60 bg-white mt-24">
      <div className="container-wide py-10 text-sm text-ink-500 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>&copy; {new Date().getFullYear()} DNS Previewer</span>
          <span className="chip-free">Free forever</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link href="/how-it-works" className="hover:text-ink-900">How it works</Link>
          <Link href="/faq" className="hover:text-ink-900">FAQ</Link>
          <Link href="/abuse" className="hover:text-ink-900">Report abuse</Link>
        </nav>
      </div>
    </footer>
  );
}
