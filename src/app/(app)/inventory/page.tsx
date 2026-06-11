import { ActionForm } from "@/components/action-form";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  btnDanger,
  inputCls,
  labelCls,
  tdCls,
  thCls,
} from "@/components/ui";
import {
  CONDITION_LABELS,
  ITEM_CONDITIONS,
  MARKETPLACE_LABELS,
  type Marketplace,
} from "@/lib/constants";
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

      <details className="mb-6 group">
        <summary className="cursor-pointer select-none rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
          + Add item
        </summary>
        <Card className="mt-3 p-5">
          <ActionForm action={createItem} submitLabel="Add item">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className={labelCls}>Name *</label>
                <input name="name" required maxLength={200} className={inputCls} placeholder="Nike Air Max 90, size 10" />
              </div>
              <div>
                <label className={labelCls}>SKU</label>
                <input name="sku" maxLength={100} className={inputCls} placeholder="A-104" />
              </div>
              <div>
                <label className={labelCls}>Brand</label>
                <input name="brand" maxLength={100} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <input name="category" maxLength={100} className={inputCls} placeholder="Shoes" />
              </div>
              <div>
                <label className={labelCls}>Size</label>
                <input name="size" maxLength={50} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Condition</label>
                <select name="condition" defaultValue="GOOD" className={inputCls}>
                  {ITEM_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Cost (what you paid) $</label>
                <input name="cost" inputMode="decimal" className={inputCls} placeholder="12.50" />
              </div>
              <div>
                <label className={labelCls}>Quantity</label>
                <input name="quantity" type="number" min={1} defaultValue={1} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Purchased on</label>
                <input name="purchasedAt" type="date" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Source</label>
                <input name="source" maxLength={200} className={inputCls} placeholder="Goodwill, estate sale…" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelCls}>Notes</label>
                <input name="notes" maxLength={5000} className={inputCls} />
              </div>
            </div>
          </ActionForm>
        </Card>
      </details>

      {items.length === 0 ? (
        <EmptyState title="No inventory yet" hint="Add your first item above — cost tracking starts here." />
      ) : (
        <Card>
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
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/50">
                  <td className={tdCls}>
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    {(item.brand || item.size) && (
                      <p className="text-xs text-zinc-400">
                        {[item.brand, item.size].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className={tdCls}>{item.sku ?? "—"}</td>
                  <td className={`${tdCls} tabular-nums`}>{formatCents(item.costCents)}</td>
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
                  <td className={`${tdCls} text-right`}>
                    <form action={deleteItem}>
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
