"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthNav({ user }: { user: { email: string; role?: string } | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <>
        <Link href="/login" className="btn-text px-2 sm:px-3 py-2 text-sm">Log in</Link>
        <Link href="/signup" className="btn-primary !py-2 !px-3 sm:!px-4 text-sm whitespace-nowrap">
          <span className="sm:hidden">Sign up</span>
          <span className="hidden sm:inline">Sign up — it&rsquo;s free</span>
        </Link>
      </>
    );
  }
  const isAdmin = user.role === "admin";
  return (
    <>
      <Link href="/dashboard" className="hidden sm:inline-flex btn-text px-3 py-2 text-sm">Dashboard</Link>
      <Link href="/create" className="btn-primary !py-2 !px-3 sm:!px-4 text-sm whitespace-nowrap">
        <span className="sm:hidden">+ New</span>
        <span className="hidden sm:inline">New preview</span>
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 ml-1 rounded-full bg-brand-50 border border-brand-100 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {initial(user.email)}
          {isAdmin && (
            <span className="inline-flex items-center rounded-full bg-violet-100 text-violet-800 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              Admin
            </span>
          )}
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-56 rounded-xl border border-ink-200 bg-white p-2 shadow-soft z-30"
            onMouseLeave={() => setOpen(false)}
          >
            <div className="px-3 py-2 text-xs text-ink-500 truncate">{user.email}</div>
            <Link href="/dashboard" className="block px-3 py-2 rounded-lg text-sm hover:bg-ink-50">
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-violet-700 hover:bg-violet-50"
              >
                Admin panel
              </Link>
            )}
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-ink-50"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function initial(email: string) {
  return email.slice(0, 1).toUpperCase();
}
