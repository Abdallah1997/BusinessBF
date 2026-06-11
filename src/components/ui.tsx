import { ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition-shadow focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

export const labelCls = "block text-xs font-medium text-zinc-600 mb-1";

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 active:translate-y-px";

export const btnDanger =
  "inline-flex items-center justify-center rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 active:translate-y-px";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = false }: { label: string; value: ReactNode; sub?: string; accent?: boolean }) {
  return (
    <Card className="p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${accent ? "text-emerald-600" : "text-zinc-900"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </Card>
  );
}

const badgeColors: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SOLD: "bg-blue-50 text-blue-700 border-blue-200",
  DELISTED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  ARCHIVED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DISMISSED: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const color = badgeColors[status] ?? "bg-zinc-100 text-zinc-600 border-zinc-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
      {label ?? status}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-12 text-center animate-fade-up">
      <p className="text-sm font-medium text-zinc-600">{title}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export const thCls = "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500";
export const tdCls = "px-4 py-3 text-sm text-zinc-700";
export const tdMoney = `${tdCls} money`;

export const summaryCls =
  "cursor-pointer select-none rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50";
