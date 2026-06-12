import { ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-zinc-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-zinc-900 dark:text-neutral-100 placeholder-zinc-400 dark:placeholder-neutral-600 transition-shadow focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

export const labelCls = "block text-xs font-medium text-zinc-600 dark:text-neutral-400 mb-1";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-700 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-neutral-300 transition-all hover:bg-zinc-50 dark:hover:bg-neutral-800 active:translate-y-px";

export const btnDanger =
  "inline-flex items-center justify-center rounded-lg px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40 active:translate-y-px";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-neutral-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = false }: { label: string; value: ReactNode; sub?: string; accent?: boolean }) {
  return (
    <Card className="p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${accent ? "text-orange-600 dark:text-orange-400" : "text-zinc-900 dark:text-neutral-100"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">{sub}</p>}
    </Card>
  );
}

const badgeColors: Record<string, string> = {
  ACTIVE: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900",
  SOLD: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  DELISTED: "bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 border-zinc-200 dark:border-neutral-800",
  ARCHIVED: "bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 border-zinc-200 dark:border-neutral-800",
  DRAFT: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  PENDING: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  CONFIRMED: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900",
  DISMISSED: "bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 border-zinc-200 dark:border-neutral-800",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const color = badgeColors[status] ?? "bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 border-zinc-200 dark:border-neutral-800";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
      {label ?? status}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-neutral-700 bg-zinc-50/50 dark:bg-neutral-900/50 px-6 py-12 text-center animate-fade-up">
      <p className="text-sm font-medium text-zinc-600 dark:text-neutral-400">{title}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">{hint}</p>}
    </div>
  );
}

export const thCls = "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400";
export const tdCls = "px-4 py-3 text-sm text-zinc-700 dark:text-neutral-300";
export const tdMoney = `${tdCls} money`;

export const summaryCls =
  "cursor-pointer select-none rounded-lg border border-zinc-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-neutral-300 transition-colors hover:bg-zinc-50 dark:hover:bg-neutral-800";
