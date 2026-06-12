"use server";

import { revalidatePath } from "next/cache";
import { ebayAccessTokenFor, fetchEbayActiveListings, publishToEbay } from "@/lib/ebay";
import { parseDollarsToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { ActionState, str } from "./action-helpers";

const EBAY_CONDITION_MAP: Record<string, string> = {
  NEW: "NEW",
  LIKE_NEW: "USED_EXCELLENT",
  GOOD: "USED_GOOD",
  FAIR: "USED_ACCEPTABLE",
  POOR: "FOR_PARTS_OR_NOT_WORKING",
};

export async function disconnectMarketplace(formData: FormData): Promise<void> {
  const user = await requireUser();
  const marketplace = str(formData, "marketplace");
  if (!marketplace) return;
  await prisma.marketplaceConnection.deleteMany({
    where: { userId: user.id, marketplace },
  });
  revalidatePath("/connections");
}

/**
 * Pull the user's active eBay listings into BusinessBF: each becomes an
 * inventory item (cost 0, to be filled in) plus an ACTIVE listing record.
 * Already-imported listings (matched by eBay URL/item id) are skipped.
 */
export async function importEbayListings(_prev: ActionState, formData_: FormData): Promise<ActionState> {
  void formData_;
  const user = await requireUser();

  const token = await ebayAccessTokenFor(user.id);
  if (!token) return { ok: false, error: "eBay is not connected. Connect it first." };

  let listings;
  try {
    listings = await fetchEbayActiveListings(token);
  } catch {
    return { ok: false, error: "Could not fetch eBay listings. Try reconnecting." };
  }
  if (listings.length === 0) return { ok: false, error: "No active eBay listings found" };

  // Skip anything we already imported (match by eBay item id in the URL or notes tag).
  const existing = await prisma.listing.findMany({
    where: { userId: user.id, marketplace: "EBAY", url: { not: null } },
    select: { url: true },
  });
  const seen = new Set(existing.map((l) => l.url));

  let imported = 0;
  for (const l of listings) {
    const url = l.url ?? `https://www.ebay.com/itm/${l.itemId}`;
    if (seen.has(url)) continue;

    await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          userId: user.id,
          name: l.title.slice(0, 200),
          costCents: 0,
          notes: `Imported from eBay (item ${l.itemId}). Set your cost for accurate profit.`,
        },
      });
      await tx.listing.create({
        data: {
          userId: user.id,
          itemId: item.id,
          marketplace: "EBAY",
          priceCents: l.priceCents,
          url,
          status: "ACTIVE",
        },
      });
    });
    imported++;
  }

  await prisma.marketplaceConnection.updateMany({
    where: { userId: user.id, marketplace: "EBAY" },
    data: { lastImportAt: new Date() },
  });

  revalidatePath("/connections");
  revalidatePath("/listings");
  revalidatePath("/inventory");
  if (imported === 0) return { ok: false, error: "All active eBay listings were already imported" };
  return { ok: true };
}

/**
 * Publish an inventory item to eBay directly. Requires the seller's eBay
 * account to have business policies set up; eBay's own error is surfaced
 * if anything is missing.
 */
export async function publishItemToEbay(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const token = await ebayAccessTokenFor(user.id);
  if (!token) return { ok: false, error: "eBay is not connected. Connect it on the Connections page." };

  const itemId = str(formData, "itemId");
  const priceCents = parseDollarsToCents(str(formData, "price"));
  const categoryId = str(formData, "categoryId");
  if (!itemId) return { ok: false, error: "Pick an item" };
  if (priceCents === null || priceCents <= 0) return { ok: false, error: "Enter a valid price" };

  const item = await prisma.item.findFirst({ where: { id: itemId, userId: user.id } });
  if (!item) return { ok: false, error: "Item not found" };

  const result = await publishToEbay(token, {
    sku: item.sku || `BBF-${item.id.slice(-8)}`,
    title: item.name,
    description:
      item.description ??
      [item.name, item.brand && `Brand: ${item.brand}`, item.size && `Size: ${item.size}`, item.notes]
        .filter(Boolean)
        .join("\n"),
    condition: EBAY_CONDITION_MAP[item.condition] ?? "USED_GOOD",
    quantity: item.quantity,
    priceDollars: (priceCents / 100).toFixed(2),
    categoryId: categoryId || undefined,
  });

  if (!result.ok || !result.listingId) {
    return { ok: false, error: result.error ?? "Publishing failed" };
  }

  await prisma.listing.create({
    data: {
      userId: user.id,
      itemId: item.id,
      marketplace: "EBAY",
      priceCents,
      url: `https://www.ebay.com/itm/${result.listingId}`,
      status: "ACTIVE",
    },
  });

  revalidatePath("/listings");
  revalidatePath("/connections");
  return { ok: true };
}
