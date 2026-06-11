import { ActionForm } from "@/components/action-form";
import { IconSparkle } from "@/components/icons";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  btnDanger,
  btnGhost,
  inputCls,
  labelCls,
  summaryCls,
  tdCls,
  tdMoney,
  thCls,
} from "@/components/ui";
import { isAiConfigured } from "@/lib/ai";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  confirmTransaction,
  createBankAccount,
  deleteBankAccount,
  dismissTransaction,
  importBankCsv,
} from "@/server/bank";

export const metadata = { title: "Bank" };

export default async function BankPage() {
  const user = await requireUser();
  const aiOn = isAiConfigured();

  const [accounts, pending, recent] = await Promise.all([
    prisma.bankAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.bankTransaction.findMany({
      where: { userId: user.id, status: "PENDING" },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.bankTransaction.findMany({
      where: { userId: user.id, status: { in: ["CONFIRMED", "DISMISSED"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Bank"
        subtitle="Import bank transactions and let AI sort business expenses from inventory buys. Nothing is booked until you confirm."
      />

      {!aiOn && (
        <Card className="mb-6 border-amber-200 bg-amber-50/60 p-4 animate-fade-up">
          <p className="text-sm text-amber-800">
            AI classification is off — add <code className="rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code> to{" "}
            <code className="rounded bg-amber-100 px-1">.env</code> and restart. Imports still work; you classify manually.
          </p>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2 animate-fade-up">
          <h2 className="text-sm font-semibold text-zinc-900">Accounts</h2>
          <p className="mt-1 text-xs text-zinc-400">
            For labeling imports only. FlipLedger never stores account numbers, routing numbers or bank logins.
          </p>
          {accounts.length > 0 && (
            <ul className="mt-4 space-y-2 stagger-children">
              {accounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{a.nickname}</p>
                    <p className="text-xs text-zinc-400">
                      {[a.institution, a.last4 ? `····${a.last4}` : null].filter(Boolean).join(" · ") || "No details"}
                    </p>
                  </div>
                  <form action={deleteBankAccount}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className={btnDanger}>Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <details className="mt-4">
            <summary className={summaryCls}>Add account</summary>
            <div className="mt-3">
              <ActionForm action={createBankAccount} submitLabel="Add account">
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Nickname *</label>
                    <input name="nickname" required maxLength={100} className={inputCls} placeholder="Business checking" />
                  </div>
                  <div>
                    <label className={labelCls}>Institution</label>
                    <input name="institution" maxLength={100} className={inputCls} placeholder="Chase" />
                  </div>
                  <div>
                    <label className={labelCls}>Last 4 digits (optional, for your reference)</label>
                    <input name="last4" maxLength={4} pattern="\d{4}" inputMode="numeric" className={inputCls} placeholder="1234" />
                  </div>
                </div>
              </ActionForm>
            </div>
          </details>
        </Card>

        <Card className="p-5 lg:col-span-3 animate-fade-up">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            Import transactions
            {aiOn && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <IconSparkle className="h-3 w-3" /> AI classification on
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Download a CSV from your bank (most banks export this) with columns{" "}
            <code className="rounded bg-zinc-100 px-1">date, description, amount</code> — spending negative, deposits positive.
            AI suggests expense vs. inventory for each spend; you confirm or dismiss below.
          </p>
          <div className="mt-4">
            <ActionForm action={importBankCsv} submitLabel="Import & classify">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Account</label>
                  <select name="bankAccountId" className={inputCls} defaultValue="">
                    <option value="">— Unassigned —</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.nickname}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>CSV file (max 1 MB, 500 rows)</label>
                  <input name="file" type="file" accept=".csv,text/csv" required className={inputCls} />
                </div>
              </div>
            </ActionForm>
          </div>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-900 animate-fade-up">
        Review queue {pending.length > 0 && <span className="text-zinc-400">({pending.length})</span>}
      </h2>
      {pending.length === 0 ? (
        <EmptyState title="Nothing to review" hint="Import a bank CSV and suggested classifications appear here." />
      ) : (
        <Card className="animate-fade-up">
          <table className="w-full">
            <thead className="border-b border-zinc-200">
              <tr>
                <th className={thCls}>Date</th>
                <th className={thCls}>Description</th>
                <th className={thCls}>Amount</th>
                <th className={thCls}>AI suggestion</th>
                <th className={thCls}>Book as</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 stagger-children">
              {pending.map((t) => {
                const suggested = t.aiSuggestion ?? (t.amountCents >= 0 ? "IGNORE" : "EXPENSE");
                return (
                  <tr key={t.id} className="transition-colors hover:bg-zinc-50/50">
                    <td className={`${tdCls} whitespace-nowrap`}>{t.date.toLocaleDateString("en-US")}</td>
                    <td className={tdCls}>
                      <p className="font-medium text-zinc-900">{t.description}</p>
                      {t.aiRationale && <p className="text-xs text-zinc-400">{t.aiRationale}</p>}
                    </td>
                    <td className={`${tdMoney} ${t.amountCents < 0 ? "text-zinc-700" : "text-emerald-600"}`}>
                      {formatCents(t.amountCents)}
                    </td>
                    <td className={tdCls}>
                      {t.aiSuggestion ? (
                        <div>
                          <StatusBadge
                            status={t.aiSuggestion === "INVENTORY" ? "ACTIVE" : t.aiSuggestion === "EXPENSE" ? "DRAFT" : "DISMISSED"}
                            label={t.aiSuggestion.toLowerCase()}
                          />
                          {t.aiConfidence != null && (
                            <p className="mt-1 text-xs text-zinc-400">{Math.round(t.aiConfidence * 100)}% confident</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className={tdCls} colSpan={2}>
                      <form action={confirmTransaction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={t.id} />
                        <select name="kind" defaultValue={suggested === "INVENTORY" ? "INVENTORY" : "EXPENSE"} className={`${inputCls} w-auto py-1 text-xs`}>
                          <option value="EXPENSE">Expense</option>
                          <option value="INVENTORY">Inventory</option>
                        </select>
                        <select name="category" defaultValue={t.aiCategory ?? "OTHER"} className={`${inputCls} w-auto py-1 text-xs`}>
                          {EXPENSE_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c as ExpenseCategory].split(" (")[0]}</option>
                          ))}
                        </select>
                        <button type="submit" className={btnGhost}>Confirm</button>
                      </form>
                      <form action={dismissTransaction} className="mt-1">
                        <input type="hidden" name="id" value={t.id} />
                        <button type="submit" className="text-xs font-medium text-zinc-400 hover:text-zinc-700">
                          Dismiss (personal / not business)
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {recent.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-sm font-semibold text-zinc-900">Recently processed</h2>
          <Card>
            <table className="w-full">
              <tbody className="divide-y divide-zinc-100">
                {recent.map((t) => (
                  <tr key={t.id}>
                    <td className={`${tdCls} whitespace-nowrap`}>{t.date.toLocaleDateString("en-US")}</td>
                    <td className={tdCls}>{t.description}</td>
                    <td className={tdMoney}>{formatCents(t.amountCents)}</td>
                    <td className={`${tdCls} text-right`}><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
