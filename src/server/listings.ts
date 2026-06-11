"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { listingSchema } from "@/lib/validators";
import { ActionState, dollarsField, fieldError, str } from "./action-helpers";

export async function createListing(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const priceCents = dollarsField(formData, "price");
  if (priceCents === null) return { ok: false, error: "Price must be a valid dollar amount" };

  const parsed = listingSchema.safeParse({
    itemId: str(formData, "itemId"),
    marketplace: str(formData, "marketplace"),
    priceCents,
    url: str(formData, "url"),
    status: str(formData, "status") || "ACTIVE",
  });
  if (!parsed.success) return fieldError(parsed.error);

  // The referenced item must belong to the caller.
  const item = await prisma.item.findFirst({
    where: { id: parsed.data.itemId, userId: user.id },
    select: { id: true },
  });
  if (!item) return { ok: false, error: "Item not found" };

  await prisma.listing.create({ data: { ...parsed.data, userId: user.id } });
  revalidatePath("/listings");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setListingStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !["DRAFT", "ACTIVE", "SOLD", "DELISTED"].includes(status)) return;

  await prisma.listing.updateMany({
    where: { id, userId: user.id },
    data: {
      status,
      delistedAt: status === "DELISTED" ? new Date() : null,
    },
  });
  revalidatePath("/listings");
  revalidatePath("/dashboard");
}

export async function deleteListing(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  await prisma.listing.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/listings");
  revalidatePath("/dashboard");
}
