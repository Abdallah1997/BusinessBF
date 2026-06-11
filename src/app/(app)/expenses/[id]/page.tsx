import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Card, PageHeader, btnGhost, inputCls, labelCls } from "@/components/ui";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import { centsToInputValue } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateExpense } from "@/server/expenses";

export const metadata = { title: "Edit expense" };

function localDateValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const expense = await prisma.expense.findFirst({ where: { id, userId: user.id } });
  if (!expense) notFound();

  return (
    <>
      <PageHeader
        title="Edit expense"
        action={<Link href="/expenses" className={btnGhost}>Back to expenses</Link>}
      />
      <Card className="max-w-2xl p-5 animate-fade-up">
        <ActionForm action={updateExpense} submitLabel="Save changes">
          <input type="hidden" name="id" value={expense.id} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Date *</label>
              <input name="date" type="date" required defaultValue={localDateValue(expense.date)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Amount $ *</label>
              <input name="amount" required inputMode="decimal" defaultValue={centsToInputValue(expense.amountCents)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <select name="category" required defaultValue={expense.category} className={inputCls}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Vendor</label>
              <input name="vendor" maxLength={200} defaultValue={expense.vendor ?? ""} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <input name="description" maxLength={2000} defaultValue={expense.description ?? ""} className={inputCls} />
            </div>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
