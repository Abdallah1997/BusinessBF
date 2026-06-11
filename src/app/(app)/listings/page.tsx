import { ActionForm } from "@/components/action-form";
import { IconAlert, IconExternal } from "@/components/icons";
import {
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  btnDanger,
  btnGhost,
  inputCls,
  labelCls,
  tdCls,
  thCls,
} from "@/components/ui";
import { MARKETPLACES, MARKETPLACE_LABELS, type Marketplace } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createListing, deleteListing, setListingStatus } from "@/server/listings";

export const metadata = { title: "Listings" };

function marketplaceLabel(m: string) {
  return MARKETPLACE_LABELS[m as Marketplace] ?? m;
}

export default async function ListingsPage() {
  const user = await requireUser();

  const [listings, activeItems] = await Promise.all([
    prisma.listing.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { item: { select: { name: true, status: true } } },
    }),
    prisma.item.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, sku: true },
    }),
  ]);

  // Items sold elsewhere but still actively listed: these need delisting.
  const delistAlerts = listings.filter(
    (l) => l.status === "ACTIVE" && l.item.status === "SOLD",
  );

  return (
    <>
      <PageHeader
        title="Listings"
        subtitle={`${listings.filter((l) => l.status === "ACTIVE").length} active across all marketplaces`}
      />

      {delistAlerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 animate-fade-up">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <IconAlert className="h-4 w-4 shrink-0" />
            {delistAlerts.length} listing{delistAlerts.length > 1 ? "s" : ""} need delisting — the item already sold elsewhere
          </p>
          <ul className="mt-2 space-y-1.5">
            {delistAlerts.map((l) => (
              <li key={l.id} className="flex items-center gap-3 text-sm text-amber-900">
                <span>{l.item.name} on <strong>{marketplaceLabel(l.marketplace)}</strong></span>
                <form action={setListingStatus}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="status" value="DELISTED" />
                  <button type="submit" className={btnGhost}>Mark delisted</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="mb-6">
        <summary className="cursor-pointer select-none rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
          + Add listing
        </summary>
        <Card className="mt-3 p-5">
          {activeItems.length === 0 ? (
            <p className="text-sm text-zinc-500">Add an inventory item first — listings link to items.</p>
          ) : (
            <ActionForm action={createListing} submitLabel="Add listing">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Item *</label>
                  <select name="itemId" required className={inputCls}>
                    {activeItems.map((i) => (
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
                  <label className={labelCls}>Price $ *</label>
                  <input name="price" required inputMode="decimal" className={inputCls} placeholder="45.00" />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className={labelCls}>Listing URL</label>
                  <input name="url" type="url" maxLength={2000} className={inputCls} placeholder="https://…" />
                </div>
              </div>
            </ActionForm>
          )}
        </Card>
      </details>

      {listings.length === 0 ? (
        <EmptyState title="No listings yet" hint="Track where each item is listed so you never double-sell." />
      ) : (
        <Card>
          <table className="w-full">
            <thead className="border-b border-zinc-200">
              <tr>
                <th className={thCls}>Item</th>
                <th className={thCls}>Marketplace</th>
                <th className={thCls}>Price</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Listed</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-50/50">
                  <td className={tdCls}>
                    <span className="font-medium text-zinc-900">{l.item.name}</span>
                    {l.url && (
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-0.5 text-xs text-emerald-600 hover:underline">
                        view <IconExternal className="h-3 w-3" />
                      </a>
                    )}
                  </td>
                  <td className={tdCls}>{marketplaceLabel(l.marketplace)}</td>
                  <td className={`${tdCls} tabular-nums`}>{formatCents(l.priceCents)}</td>
                  <td className={tdCls}><StatusBadge status={l.status} /></td>
                  <td className={tdCls}>{l.listedAt.toLocaleDateString("en-US")}</td>
                  <td className={`${tdCls} text-right whitespace-nowrap`}>
                    {l.status === "ACTIVE" && (
                      <form action={setListingStatus} className="inline-block mr-2">
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="status" value="DELISTED" />
                        <button type="submit" className="text-xs font-medium text-zinc-500 hover:text-zinc-800">
                          Delist
                        </button>
                      </form>
                    )}
                    <form action={deleteListing} className="inline-block">
                      <input type="hidden" name="id" value={l.id} />
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
