import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { ItemFields } from "@/components/item-fields";
import { ReceiptScanner } from "@/components/receipt-scanner";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  btnDanger,
  summaryCls,
  tdCls,
  tdMoney,
  thCls,
} from "@/components/ui";
import { MARKETPLACE_LABELS, type Marketplace } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createItem, deleteItem } from "@/server/items";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const user = await requireUser();

  const items = await prisma.item.findMany({
    where: { userId: user.id, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: { listings: { where: { status: "ACTIVE" }, select: { marketplace: true } } },
  });

  const totalCostCents = items
    .filter((i) => i.status === "ACTIVE")
    .reduce((sum, i) => sum + i.costCents * i.quantity, 0);

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle={`${items.filter((i) => i.status === "ACTIVE").length} active items · ${formatCents(totalCostCents)} invested`}
      />

      <div className="mb-6 space-y-3">
        <details className="group">
          <summary className={summaryCls}>Scan receipt with AI</summary>
          <Card className="mt-3 p-5">
            <ReceiptScanner />
          </Card>
        </details>

        <details>
          <summary className={summaryCls}>Add item manually</summary>
          <Card className="mt-3 p-5">
            <ActionForm action={createItem} submitLabel="Add item">
              <ItemFields />
            </ActionForm>
          </Card>
        </details>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No inventory yet" hint="Scan a receipt or add your first item — cost tracking starts here." />
      ) : (
        <Card className="animate-fade-up">
          <table className="w-full">
            <thead className="border-b border-zinc-200">
              <tr>
                <th className={thCls}>Item</th>
                <th className={thCls}>SKU</th>
                <th className={thCls}>Cost</th>
                <th className={thCls}>Qty</th>
                <th className={thCls}>Listed on</th>
                <th className={thCls}>Status</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 stagger-children">
              {items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-zinc-50/50">
                  <td className={tdCls}>
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    {(item.brand || item.size) && (
                      <p className="text-xs text-zinc-400">
                        {[item.brand, item.size].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className={tdCls}>{item.sku ?? "—"}</td>
                  <td className={tdMoney}>{formatCents(item.costCents)}</td>
                  <td className={tdCls}>{item.quantity}</td>
                  <td className={tdCls}>
                    {item.listings.length === 0 ? (
                      <span className="text-zinc-400">Not listed</span>
                    ) : (
                      <span className="text-xs">
                        {item.listings.map((l) => MARKETPLACE_LABELS[l.marketplace as Marketplace] ?? l.marketplace).join(", ")}
                      </span>
                    )}
                  </td>
                  <td className={tdCls}><StatusBadge status={item.status} /></td>
                  <td className={`${tdCls} text-right whitespace-nowrap`}>
                    <Link
                      href={`/inventory/${item.id}`}
                      className="mr-2 text-xs font-medium text-emerald-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={deleteItem} className="inline-block">
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className={btnDanger}>Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
