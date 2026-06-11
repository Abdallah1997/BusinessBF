"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { saleSchema } from "@/lib/validators";
import { ActionState, dollarsField, fieldError, str } from "./action-helpers";

export async function createSale(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const money = {
    salePriceCents: dollarsField(formData, "salePrice"),
    shippingChargedCents: dollarsField(formData, "shippingCharged"),
    feesCents: dollarsField(formData, "fees"),
    shippingCostCents: dollarsField(formData, "shippingCost"),
    otherCostCents: dollarsField(formData, "otherCost"),
  };
  for (const [key, value] of Object.entries(money)) {
    if (value === null) return { ok: false, error: `${key}: invalid dollar amount` };
  }

  const parsed = saleSchema.safeParse({
    itemId: str(formData, "itemId"),
    listingId: str(formData, "listingId"),
    marketplace: str(formData, "marketplace"),
    soldAt: str(formData, "soldAt"),
    ...money,
    notes: str(formData, "notes"),
  });
  if (!parsed.success) return fieldError(parsed.error);
  const data = parsed.data;

  // Verify ownership of any linked records before writing.
  let costOfGoodsCents = 0;
  if (data.itemId) {
    const item = await prisma.item.findFirst({
      where: { id: data.itemId, userId: user.id },
      select: { id: true, costCents: true, quantity: true },
    });
    if (!item) return { ok: false, error: "Item not found" };
    costOfGoodsCents = item.costCents;
  }
  if (data.listingId) {
    const listing = await prisma.listing.findFirst({
      where: { id: data.listingId, userId: user.id },
      select: { id: true },
    });
    if (!listing) return { ok: false, error: "Listing not found" };
  } else if (data.itemId) {
    // No listing chosen: link the item's active listing on the sale
    // marketplace automatically so it gets marked SOLD (not a delist alert).
    const match = await prisma.listing.findFirst({
      where: {
        itemId: data.itemId,
        userId: user.id,
        marketplace: data.marketplace,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (match) data.listingId = match.id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.create({
      data: {
        userId: user.id,
        itemId: data.itemId,
        listingId: data.listingId,
        marketplace: data.marketplace,
        soldAt: data.soldAt,
        salePriceCents: data.salePriceCents,
        shippingChargedCents: data.shippingChargedCents,
        feesCents: data.feesCents,
        shippingCostCents: data.shippingCostCents,
        otherCostCents: data.otherCostCents,
        costOfGoodsCents,
        notes: data.notes,
      },
    });

    if (data.listingId) {
      await tx.listing.updateMany({
        where: { id: data.listingId, userId: user.id },
        data: { status: "SOLD" },
      });
    }

    if (data.itemId) {
      const item = await tx.item.findFirst({
        where: { id: data.itemId, userId: user.id },
        select: { quantity: true },
      });
      if (item) {
        if (item.quantity > 1) {
          await tx.item.updateMany({
            where: { id: data.itemId, userId: user.id },
            data: { quantity: item.quantity - 1 },
          });
        } else {
          // Last unit sold: mark the item sold. Listings on other
          // marketplaces stay ACTIVE and surface as delist alerts.
          await tx.item.updateMany({
            where: { id: data.itemId, userId: user.id },
            data: { status: "SOLD" },
          });
        }
      }
    }
  });

  revalidatePath("/sales");
  revalidatePath("/listings");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteSale(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  await prisma.sale.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/sales");
  revalidatePath("/dashboard");
}
