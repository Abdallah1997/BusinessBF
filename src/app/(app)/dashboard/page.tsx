import Link from "next/link";
import { AiInsights } from "@/components/ai-insights";
import { AnimatedMoney } from "@/components/animated-number";
import { IconAlert } from "@/components/icons";
import { Card, EmptyState, PageHeader, StatCard, tdCls, tdMoney, thCls } from "@/components/ui";
import { isAiConfigured } from "@/lib/ai";
import { MARKETPLACE_LABELS, type Marketplace } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { grossCents, profitCents } from "@/lib/profit";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [salesThisYear, activeListingCount, activeItems, delistAlertCount, recentSales] =
    await Promise.all([
      prisma.sale.findMany({
        where: { userId: user.id, soldAt: { gte: startOfYear } },
        select: {
          soldAt: true,
          salePriceCents: true,
          shippingChargedCents: true,
          feesCents: true,
          shippingCostCents: true,
          otherCostCents: true,
          costOfGoodsCents: true,
        },
      }),
      prisma.listing.count({ where: { userId: user.id, status: "ACTIVE" } }),
      prisma.item.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        select: { costCents: true, quantity: true },
      }),
      prisma.listing.count({
        where: { userId: user.id, status: "ACTIVE", item: { status: "SOLD" } },
      }),
      prisma.sale.findMany({
        where: { userId: user.id },
        orderBy: { soldAt: "desc" },
        take: 8,
        include: { item: { select: { name: true } } },
      }),
    ]);

  const monthSales = salesThisYear.filter((s) => s.soldAt >= startOfMonth);
  const revenueMtd = monthSales.reduce((sum, s) => sum + grossCents(s), 0);
  const profitMtd = monthSales.reduce((sum, s) => sum + profitCents(s), 0);
  const profitYtd = salesThisYear.reduce((sum, s) => sum + profitCents(s), 0);
  const inventoryValue = activeItems.reduce((sum, i) => sum + i.costCents * i.quantity, 0);

  // Profit by month for the running year (simple bar chart).
  const monthlyProfit = Array.from({ length: 12 }, (_, m) =>
    salesThisYear
      .filter((s) => s.soldAt.getMonth() === m)
      .reduce((sum, s) => sum + profitCents(s), 0),
  );
  const maxAbs = Math.max(1, ...monthlyProfit.map((v) => Math.abs(v)));
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <>
      <PageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} subtitle="Here's how your reselling business is doing." />

      {delistAlertCount > 0 && (
        <Link
          href="/listings"
          className="mb-6 flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-300 transition-colors hover:bg-amber-100 animate-fade-up"
        >
          <IconAlert className="h-4 w-4 shrink-0" />
          {delistAlertCount} listing{delistAlertCount > 1 ? "s" : ""} still active for items that already sold: review now
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatCard label="Revenue (this month)" value={<AnimatedMoney cents={revenueMtd} />} sub={`${monthSales.length} sales`} />
        <StatCard label="Profit (this month)" value={<AnimatedMoney cents={profitMtd} />} accent />
        <StatCard label="Profit (year to date)" value={<AnimatedMoney cents={profitYtd} />} accent />
        <StatCard label="Inventory at cost" value={<AnimatedMoney cents={inventoryValue} />} sub={`${activeListingCount} active listings`} />
      </div>

      <div className="mt-6 animate-fade-up">
        <AiInsights aiConfigured={isAiConfigured()} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Profit by month ({now.getFullYear()})</h2>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {monthlyProfit.map((v, m) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t animate-grow-bar ${v >= 0 ? "bg-orange-500" : "bg-red-400"}`}
                  style={{
                    height: `${Math.max(2, (Math.abs(v) / maxAbs) * 130)}px`,
                    animationDelay: `${m * 40}ms`,
                  }}
                  title={`${monthNames[m]}: ${formatCents(v)}`}
                />
                <span className="text-[10px] text-zinc-400 dark:text-neutral-500">{monthNames[m][0]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Recent sales</h2>
            <Link href="/sales" className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline">
              View all →
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No sales yet" hint="Record your first sale to see profit tracking in action." />
            </div>
          ) : (
            <table className="mt-3 w-full">
              <thead className="border-b border-zinc-200 dark:border-neutral-800">
                <tr>
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Item</th>
                  <th className={thCls}>Marketplace</th>
                  <th className={thCls}>Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-neutral-800">
                {recentSales.map((s) => {
                  const profit = profitCents(s);
                  return (
                    <tr key={s.id}>
                      <td className={`${tdCls} whitespace-nowrap`}>{s.soldAt.toLocaleDateString("en-US")}</td>
                      <td className={tdCls}>{s.item?.name ?? "—"}</td>
                      <td className={tdCls}>{MARKETPLACE_LABELS[s.marketplace as Marketplace] ?? s.marketplace}</td>
                      <td className={`${tdMoney} font-semibold ${profit >= 0 ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatCents(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
