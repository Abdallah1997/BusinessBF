"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { BRAND } from "@/lib/constants";
import { btnPrimary, inputCls, labelCls } from "./ui";

/** Only allow same-origin relative redirects ("/foo"), never "//evil.com" or absolute URLs. */
function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    const target = safeNext(searchParams.get("next"));

    const result =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
      return;
    }
    router.push(target);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-xl font-bold tracking-tight text-zinc-900">
          <span className="text-emerald-600">Flip</span>Ledger
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {mode === "signup" ? BRAND.tagline : "Sign in to your account."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className={labelCls}>Name</label>
                <input id="name" name="name" type="text" required maxLength={100} autoComplete="name" className={inputCls} />
              </div>
            )}
            <div>
              <label htmlFor="email" className={labelCls}>Email</label>
              <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className={inputCls} />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={128}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className={inputCls}
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-zinc-400">At least 10 characters.</p>
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {mode === "signup" ? (
            <>Already have an account? <Link href="/login" className="font-medium text-emerald-600 hover:underline">Sign in</Link></>
          ) : (
            <>New here? <Link href="/signup" className="font-medium text-emerald-600 hover:underline">Create an account</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
