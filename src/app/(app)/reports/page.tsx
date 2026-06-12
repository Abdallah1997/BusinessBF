import Link from "next/link";
import { Card, PageHeader, btnGhost } from "@/components/ui";
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { buildYearReport } from "@/lib/reports";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Reports" };

function Row({ label, value, bold = false, indent = false }: { label: string; value: string; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${indent ? "pl-4" : ""}`}>
      <span className={`text-sm ${bold ? "font-semibold text-zinc-900 dark:text-neutral-100" : "text-zinc-600 dark:text-neutral-400"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? "font-bold text-zinc-900 dark:text-neutral-100" : "text-zinc-700 dark:text-neutral-300"}`}>{value}</span>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const currentYear = new Date().getFullYear();
  const parsedYear = Number.parseInt(params.year ?? "", 10);
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= currentYear + 1
      ? parsedYear
      : currentYear;

  const report = await buildYearReport(user.id, year);

  const expenseEntries = Object.entries(report.expensesByCategory) as [ExpenseCategory, number][];
  expenseEntries.sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Profit & loss and a Schedule C-ready summary for your tax filing."
        action={
          <div className="flex items-center gap-2">
            {[currentYear, currentYear - 1].map((y) => (
              <Link
                key={y}
                href={`/reports?year=${y}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  y === year ? "bg-orange-600 text-white" : "border border-zinc-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-zinc-700 dark:text-neutral-300 hover:bg-zinc-50 dark:hover:bg-neutral-800"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
            Profit &amp; Loss: {report.year}
          </h2>
          <div className="mt-4 divide-y divide-zinc-100 dark:divide-neutral-800">
            <Row label={`Gross receipts (${report.saleCount} sales)`} value={formatCents(report.grossReceiptsCents)} />
            <Row label="Cost of goods sold" value={`(${formatCents(report.cogsCents)})`} />
            <Row label="Gross profit" value={formatCents(report.grossProfitCents)} bold />
            <Row label="Marketplace & payment fees" value={`(${formatCents(report.marketplaceFeesCents)})`} indent />
            <Row label="Shipping labels & postage" value={`(${formatCents(report.shippingCostsCents)})`} indent />
            <Row label="Packaging & other sale costs" value={`(${formatCents(report.otherSaleCostsCents)})`} indent />
            <Row label="Operating expenses" value={`(${formatCents(report.totalExpensesCents)})`} indent />
            <Row label={`Mileage (${report.totalMiles.toFixed(0)} mi)`} value={`(${formatCents(report.mileageDeductionCents)})`} indent />
            <Row label="Net profit" value={formatCents(report.netProfitCents)} bold />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">
            Expenses by Schedule C category: {report.year}
          </h2>
          {expenseEntries.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400 dark:text-neutral-500">No expenses recorded for {report.year}.</p>
          ) : (
            <div className="mt-4 divide-y divide-zinc-100 dark:divide-neutral-800">
              {expenseEntries.map(([category, cents]) => (
                <Row key={category} label={EXPENSE_CATEGORY_LABELS[category] ?? category} value={formatCents(cents)} />
              ))}
              <Row label="Total" value={formatCents(report.totalExpensesCents)} bold />
            </div>
          )}
          <p className="mt-4 text-xs text-zinc-400 dark:text-neutral-500">
            Line numbers reference IRS Schedule C (Form 1040). This summary is a bookkeeping aid, not tax advice.
          </p>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">Export your data</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">Everything you enter is yours: download it as CSV anytime.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`/api/export/sales?year=${year}`} className={btnGhost} download>Sales {year} (CSV)</a>
          <a href={`/api/export/expenses?year=${year}`} className={btnGhost} download>Expenses {year} (CSV)</a>
          <a href="/api/export/inventory" className={btnGhost} download>Inventory (CSV)</a>
        </div>
      </Card>
    </>
  );
}
