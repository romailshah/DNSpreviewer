import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  currentUser,
  clearAuthCookie,
  revokeSession,
  userFromToken,
} from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { AuthNav } from "./AuthNav";

/**
 * Server action used by the mobile hamburger's Log out button.
 * Kept inline here so we can fulfil the "only edit SiteHeader.tsx" constraint.
 */
async function mobileLogout() {
  "use server";
  const c = await cookies();
  const token = c.get("dnsp_session")?.value;
  const user = userFromToken(token);
  if (token) revokeSession(token);
  await clearAuthCookie();
  if (user) logActivity("user.logout", { userId: user.id });
  redirect("/");
}

export async function SiteHeader() {
  const user = await currentUser();
  const authUser = user ? { email: user.email, role: user.role } : null;
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200/60 bg-cream/80 backdrop-blur">
      <div className="container-wide flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display font-bold text-ink-900 shrink-0"
        >
          <LogoMark />
          <span className="text-base sm:text-lg tracking-tight whitespace-nowrap">
            DNS Previewer
          </span>
        </Link>

        {/* ---------- DESKTOP NAV (unchanged) — visible on lg (1024px) and up ---------- */}
        <nav className="hidden lg:flex items-center gap-2 shrink-0">
          <Link href="/how-it-works" className="btn-text px-3 py-2 text-sm">
            How it works
          </Link>
          <Link href="/faq" className="btn-text px-3 py-2 text-sm">
            FAQ
          </Link>
          <AuthNav user={authUser} />
        </nav>

        {/* ---------- MOBILE NAV — visible below lg ---------- */}
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          {/* Primary CTA stays outside the hamburger per spec */}
          {user ? (
            <Link
              href="/create"
              className="btn-primary !py-2 !px-3 text-sm whitespace-nowrap"
            >
              + New
            </Link>
          ) : (
            <Link
              href="/signup"
              className="btn-primary !py-2 !px-3 text-sm whitespace-nowrap"
            >
              Sign up
            </Link>
          )}

          {/*
            Hamburger is a native <details>/<summary>: the browser toggles
            `open` on summary click — no client-side JS needed, keeps
            SiteHeader a server component.
          */}
          <details className="relative group">
            <summary
              className="list-none cursor-pointer inline-flex items-center justify-center h-10 w-10 rounded-xl text-ink-900 hover:bg-ink-100 transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <svg
                className="group-open:hidden"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <svg
                className="hidden group-open:block"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </summary>

            {/* Dropdown panel */}
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-ink-200 bg-white p-2 shadow-soft z-40"
            >
              {user ? (
                <>
                  {/* Identity block */}
                  <div className="px-3 py-2 border-b border-ink-100 mb-1">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
                      Signed in
                    </div>
                    <div className="mt-0.5 text-xs text-ink-700 break-all">
                      {user.email}
                    </div>
                    {isAdmin && (
                      <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide mt-1.5">
                        Admin
                      </span>
                    )}
                  </div>

                  <MenuLink href="/dashboard">Dashboard</MenuLink>
                  {isAdmin && (
                    <MenuLink href="/admin" accent>
                      Admin panel
                    </MenuLink>
                  )}

                  <MenuSeparator />

                  <MenuLink href="/how-it-works">How it works</MenuLink>
                  <MenuLink href="/faq">FAQ</MenuLink>

                  <MenuSeparator />

                  <form action={mobileLogout}>
                    <button
                      type="submit"
                      className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-50 transition"
                    >
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <MenuLink href="/how-it-works">How it works</MenuLink>
                  <MenuLink href="/faq">FAQ</MenuLink>

                  <MenuSeparator />

                  <MenuLink href="/login">Log in</MenuLink>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  accent,
  children,
}: {
  href: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-lg text-sm transition ${
        accent
          ? "font-semibold text-violet-700 hover:bg-violet-50"
          : "font-medium text-ink-900 hover:bg-ink-50"
      }`}
    >
      {children}
    </Link>
  );
}

function MenuSeparator() {
  return <div className="my-1 border-t border-ink-100" />;
}

function LogoMark() {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-glow">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 12c3-4.5 6-7 9-7s6 2.5 9 7c-3 4.5-6 7-9 7s-6-2.5-9-7z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      </svg>
    </span>
  );
}
