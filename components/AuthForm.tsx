"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-ink-900">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input mt-2"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-ink-900">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="input mt-2"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {mode === "signup" && (
          <p className="mt-1 text-xs text-ink-500">At least 8 characters.</p>
        )}
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </button>
      <p className="text-sm text-ink-500 text-center">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
              Sign up free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
