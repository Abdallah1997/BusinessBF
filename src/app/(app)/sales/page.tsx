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
import { MARKETPLACES, MARKETPLACE_LABELS, type Marketplace } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { profitCents } from "@/lib/profit";
import { requireUser } from "@/lib/session";
import { createSale, deleteSale } from "@/server/sales";

export const metadata = { title: "Sales" };

export default async function SalesPage() {
  const user = await requireUser();

  const [sales, sellableItems] = await Promise.all([
    prisma.sale.findMany({
      where: { userId: user.id },
      orderBy: { soldAt: "desc" },
      include: { item: { select: { name: true } } },
      take: 200,
    }),
    prisma.item.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, sku: true },
    }),
  ]);

  const totalProfit = sales.reduce((sum, s) => sum + profitCents(s), 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle={`${sales.length} sales · ${formatCents(totalProfit)} total profit`}
      />

      <details className="mb-6">
        <summary className="cursor-pointer select-none rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
          + Record sale
        </summary>
        <Card className="mt-3 p-5">
          <ActionForm action={createSale} submitLabel="Record sale">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Item (optional — links COGS automatically)</label>
                <select name="itemId" className={inputCls} defaultValue="">
                  <option value="">— No linked item —</option>
                  {sellableItems.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.sku ? `[${i.sku}] ` : ""}{i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Marketplace *</label>
                <select name="marketplace" required className={inputCls}>
                  {MARKETPLACES.map((m) => (
                    <option key={m} value={m}>{MARKETPLACE_LABELS[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Sold on *</label>
                <input name="soldAt" type="date" required defaultValue={today} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Sale price $ *</label>
                <input name="salePrice" required inputMode="decimal" className={inputCls} placeholder="45.00" />
              </div>
              <div>
                <label className={labelCls}>Shipping charged $</label>
                <input name="shippingCharged" inputMode="decimal" className={inputCls} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Fees $</label>
                <input name="fees" inputMode="decimal" className={inputCls} placeholder="6.12" />
              </div>
              <div>
                <label className={labelCls}>Shipping cost $</label>
                <input name="shippingCost" inputMode="decimal" className={inputCls} placeholder="8.45" />
              </div>
              <div>
                <label className={labelCls}>Other cost $</label>
                <input name="otherCost" inputMode="decimal" className={inputCls} placeholder="0.50" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelCls}>Notes</label>
                <input name="notes" maxLength={5000} className={inputCls} />
              </div>
            </div>
          </ActionForm>
        </Card>
      </details>

      {sales.length === 0 ? (
        <EmptyState title="No sales recorded" hint="Record a sale to see profit after fees, shipping and cost of goods." />
      ) : (
        <Card>
          <table className="w-full">
            <thead className="border-b border-zinc-200">
              <tr>
                <th className={thCls}>Date</th>
                <th className={thCls}>Item</th>
                <th className={thCls}>Marketplace</th>
                <th className={thCls}>Gross</th>
                <th className={thCls}>Fees</th>
                <th className={thCls}>Ship</th>
                <th className={thCls}>COGS</th>
                <th className={thCls}>Profit</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sales.map((s) => {
                const profit = profitCents(s);
                return (
                  <tr key={s.id} className="hover:bg-zinc-50/50">
                    <td className={`${tdCls} whitespace-nowrap`}>{s.soldAt.toLocaleDateString("en-US")}</td>
                    <td className={tdCls}>
                      <span className="font-medium text-zinc-900">{s.item?.name ?? "—"}</span>
                    </td>
                    <td className={tdCls}>{MARKETPLACE_LABELS[s.marketplace as Marketplace] ?? s.marketplace}</td>
                    <td className={`${tdCls} tabular-nums`}>{formatCents(s.salePriceCents + s.shippingChargedCents)}</td>
                    <td className={`${tdCls} tabular-nums`}>{formatCents(s.feesCents)}</td>
                    <td className={`${tdCls} tabular-nums`}>{formatCents(s.shippingCostCents)}</td>
                    <td className={`${tdCls} tabular-nums`}>{formatCents(s.costOfGoodsCents)}</td>
                    <td className={`${tdCls} tabular-nums font-semibold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCents(profit)}
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <form action={deleteSale}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className={btnDanger}>Delete</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
