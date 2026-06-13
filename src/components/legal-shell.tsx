import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

/** Shared chrome for static legal pages (Privacy, Terms). Public, no auth. */
export function LegalShell({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-lg font-semibold tracking-tighter text-white shadow-lg shadow-orange-500/20">
            B
          </span>
          <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-neutral-100">BusinessBF</span>
        </Link>
        <ThemeToggle />
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-20 pt-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-neutral-100">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400 dark:text-neutral-500">Last updated {updated}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-600 dark:text-neutral-400 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-neutral-100 [&_a]:text-orange-600 dark:[&_a]:text-orange-400 [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </div>
      </article>

      <footer className="border-t border-zinc-100 py-8 text-center text-xs text-zinc-400 dark:border-neutral-800 dark:text-neutral-500">
        © {new Date().getFullYear()} BusinessBF ·{" "}
        <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-neutral-300">Privacy</Link> ·{" "}
        <Link href="/terms" className="hover:text-zinc-600 dark:hover:text-neutral-300">Terms</Link>
      </footer>
    </div>
  );
}
