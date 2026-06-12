import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import {
  Card,
  EmptyState,
  PageHeader,
  btnDanger,
  inputCls,
  labelCls,
  tdCls,
  thCls,
} from "@/components/ui";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  MILEAGE_RATE_CENTS_PER_MILE,
  type ExpenseCategory,
} from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createExpense, createMileage, deleteExpense, deleteMileage } from "@/server/expenses";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const user = await requireUser();

  const [expenses, mileage] = await Promise.all([
    prisma.expense.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.mileageEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 100,
    }),
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const totalMiles = mileage.reduce((sum, m) => sum + m.miles, 0);
  const mileageDeduction = Math.round(totalMiles * MILEAGE_RATE_CENTS_PER_MILE);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`${formatCents(totalExpenses)} expenses · ${totalMiles.toFixed(0)} mi (${formatCents(mileageDeduction)} deduction)`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-neutral-100">Add expense</h2>
          <ActionForm action={createExpense} submitLabel="Add expense">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Date *</label>
                <input name="date" type="date" required defaultValue={today} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Amount $ *</label>
                <input name="amount" required inputMode="decimal" className={inputCls} placeholder="24.99" />
              </div>
              <div>
                <label className={labelCls}>Category *</label>
                <select name="category" required className={inputCls}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Vendor</label>
                <input name="vendor" maxLength={200} className={inputCls} placeholder="USPS, ULINE…" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Description</label>
                <input name="description" maxLength={2000} className={inputCls} />
              </div>
            </div>
          </ActionForm>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-neutral-100">
            Log mileage <span className="font-normal text-zinc-400 dark:text-neutral-500">(${(MILEAGE_RATE_CENTS_PER_MILE / 100).toFixed(2)}/mi standard rate)</span>
          </h2>
          <ActionForm action={createMileage} submitLabel="Log miles">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Date *</label>
                <input name="date" type="date" required defaultValue={today} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Miles *</label>
                <input name="miles" required type="number" step="0.1" min="0.1" className={inputCls} placeholder="14.2" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Purpose</label>
                <input name="purpose" maxLength={500} className={inputCls} placeholder="Sourcing trip: estate sale" />
              </div>
            </div>
          </ActionForm>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-neutral-100">Recent expenses</h2>
          {expenses.length === 0 ? (
            <EmptyState title="No expenses yet" hint="Every recorded expense lowers your taxable income." />
          ) : (
            <Card>
              <table className="w-full">
                <thead className="border-b border-zinc-200 dark:border-neutral-800">
                  <tr>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Category</th>
                    <th className={thCls}>Amount</th>
                    <th className={thCls}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-neutral-800">
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className={`${tdCls} whitespace-nowrap`}>{e.date.toLocaleDateString("en-US")}</td>
                      <td className={tdCls}>
                        <p>{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory]?.split(" (")[0] ?? e.category}</p>
                        {e.vendor && <p className="text-xs text-zinc-400 dark:text-neutral-500">{e.vendor}</p>}
                      </td>
                      <td className={`${tdCls} tabular-nums`}>{formatCents(e.amountCents)}</td>
                      <td className={`${tdCls} text-right whitespace-nowrap`}>
                        <Link href={`/expenses/${e.id}`} className="mr-2 text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline">
                          Edit
                        </Link>
                        <form action={deleteExpense} className="inline-block">
                          <input type="hidden" name="id" value={e.id} />
                          <button type="submit" className={btnDanger}>Delete</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-neutral-100">Mileage log</h2>
          {mileage.length === 0 ? (
            <EmptyState title="No mileage logged" hint="Sourcing trips and post office runs are deductible." />
          ) : (
            <Card>
              <table className="w-full">
                <thead className="border-b border-zinc-200 dark:border-neutral-800">
                  <tr>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Miles</th>
                    <th className={thCls}>Purpose</th>
                    <th className={thCls}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-neutral-800">
                  {mileage.map((m) => (
                    <tr key={m.id}>
                      <td className={`${tdCls} whitespace-nowrap`}>{m.date.toLocaleDateString("en-US")}</td>
                      <td className={`${tdCls} tabular-nums`}>{m.miles}</td>
                      <td className={tdCls}>{m.purpose ?? "—"}</td>
                      <td className={`${tdCls} text-right`}>
                        <form action={deleteMileage}>
                          <input type="hidden" name="id" value={m.id} />
                          <button type="submit" className={btnDanger}>Delete</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
