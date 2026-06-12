import { ActionForm } from "@/components/action-form";
import { IconCheck, IconTag } from "@/components/icons";
import { Card, PageHeader, StatusBadge, btnGhost, btnPrimary, inputCls, labelCls } from "@/components/ui";
import { isEbayConfigured } from "@/lib/ebay";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { disconnectMarketplace, importEbayListings, publishItemToEbay } from "@/server/marketplaces";

export const metadata = { title: "Connections" };

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const ebayOn = isEbayConfigured();

  const [connections, sellableItems] = await Promise.all([
    prisma.marketplaceConnection.findMany({ where: { userId: user.id } }),
    prisma.item.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, sku: true },
    }),
  ]);
  const ebayConn = connections.find((c) => c.marketplace === "EBAY");

  return (
    <>
      <PageHeader
        title="Connections"
        subtitle="Link your marketplaces to pull listings in and post listings out without leaving BusinessBF."
      />

      {params.error === "ebay-auth-failed" && (
        <Card className="mb-6 border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/30 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">eBay connection failed. Start the flow again.</p>
        </Card>
      )}
      {params.connected === "ebay" && (
        <Card className="mb-6 border-orange-200 dark:border-orange-900 bg-orange-50/60 dark:bg-orange-950/30 p-4">
          <p className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-300">
            <IconCheck className="h-4 w-4" /> eBay connected. Import your listings below.
          </p>
        </Card>
      )}

      <div className="space-y-6">
        {/* eBay: real API integration */}
        <Card className="p-6 animate-fade-up">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-neutral-100">
                eBay
                {ebayConn?.status === "CONNECTED" && <StatusBadge status="CONFIRMED" label="connected" />}
                {ebayConn?.status === "EXPIRED" && <StatusBadge status="PENDING" label="reconnect needed" />}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-zinc-500 dark:text-neutral-400">
                Full two-way sync over eBay&apos;s official API: import your active listings, and publish inventory
                items as new eBay listings without leaving this app.
              </p>
            </div>
            {ebayConn ? (
              <form action={disconnectMarketplace}>
                <input type="hidden" name="marketplace" value="EBAY" />
                <button type="submit" className={btnGhost}>Disconnect</button>
              </form>
            ) : ebayOn ? (
              <a href="/api/ebay/connect" className={btnPrimary}>Connect eBay</a>
            ) : null}
          </div>

          {!ebayOn && (
            <div className="mt-4 rounded-lg border border-dashed border-zinc-300 dark:border-neutral-700 bg-zinc-50/60 dark:bg-neutral-900/60 p-4">
              <p className="text-sm text-zinc-600 dark:text-neutral-400">
                To enable: create a free app at <span className="font-medium">developer.ebay.com</span>, set its
                redirect URL to <code className="rounded bg-zinc-100 dark:bg-neutral-800 px-1">/api/ebay/callback</code>, then add{" "}
                <code className="rounded bg-zinc-100 dark:bg-neutral-800 px-1">EBAY_CLIENT_ID</code>,{" "}
                <code className="rounded bg-zinc-100 dark:bg-neutral-800 px-1">EBAY_CLIENT_SECRET</code> and{" "}
                <code className="rounded bg-zinc-100 dark:bg-neutral-800 px-1">EBAY_RU_NAME</code> to .env and restart. A Connect button
                appears here.
              </p>
            </div>
          )}

          {ebayConn?.status === "CONNECTED" && (
            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 dark:border-neutral-800 p-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Import listings</h3>
                <p className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">
                  Pulls your active eBay listings into inventory and the listings tracker.
                  {ebayConn.lastImportAt &&
                    ` Last import: ${ebayConn.lastImportAt.toLocaleDateString("en-US")}.`}
                </p>
                <div className="mt-3">
                  <ActionForm action={importEbayListings} submitLabel="Import active listings">
                    <span />
                  </ActionForm>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200 dark:border-neutral-800 p-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Post to eBay</h3>
                <p className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">
                  Publishes directly via the Inventory API. Your eBay account needs business policies
                  (payment, shipping, returns) configured once on eBay.
                </p>
                {sellableItems.length === 0 ? (
                  <p className="mt-3 text-xs text-zinc-400 dark:text-neutral-500">Add inventory first.</p>
                ) : (
                  <div className="mt-3">
                    <ActionForm action={publishItemToEbay} submitLabel="Publish to eBay">
                      <div className="space-y-3">
                        <div>
                          <label className={labelCls}>Item</label>
                          <select name="itemId" required className={inputCls}>
                            {sellableItems.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.sku ? `[${i.sku}] ` : ""}{i.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Price $</label>
                            <input name="price" required inputMode="decimal" className={inputCls} placeholder="45.00" />
                          </div>
                          <div>
                            <label className={labelCls}>eBay category ID (optional)</label>
                            <input name="categoryId" inputMode="numeric" className={inputCls} placeholder="15709" />
                          </div>
                        </div>
                      </div>
                    </ActionForm>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Poshmark + Mercari: no public APIs; say so plainly */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[
            { name: "Poshmark", detail: "Poshmark has no public seller API." },
            { name: "Mercari", detail: "Mercari has no public seller API for individual sellers." },
          ].map((m) => (
            <Card key={m.name} className="p-6 animate-fade-up">
              <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-neutral-100">
                {m.name}
                <StatusBadge status="DRAFT" label="assisted" />
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-neutral-400">
                {m.detail} Tools that auto-post there use browser extensions; a BusinessBF extension is on the
                roadmap. Until then the workflow is two clicks:
              </p>
              <ol className="mt-3 space-y-1.5 text-sm text-zinc-600 dark:text-neutral-400">
                <li className="flex gap-2">
                  <span className="font-semibold text-orange-600 dark:text-orange-400">1.</span>
                  Generate the listing in the Composer (AI writes it from your inventory item)
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-orange-600 dark:text-orange-400">2.</span>
                  Copy the {m.name}-formatted version and paste into the {m.name} app
                </li>
              </ol>
              <a href="/composer" className={`${btnGhost} mt-4`}>
                <IconTag className="h-4 w-4" /> Open Composer
              </a>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
