"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { itemSchema } from "@/lib/validators";
import { ActionState, dollarsField, fieldError, str } from "./action-helpers";

type ItemFormResult =
  | { error: string }
  | { zodError: z.ZodError }
  | { data: z.infer<typeof itemSchema> };

function parseItemForm(formData: FormData): ItemFormResult {
  const costCents = dollarsField(formData, "cost");
  if (costCents === null) return { error: "Cost must be a valid dollar amount" };

  const parsed = itemSchema.safeParse({
    name: str(formData, "name"),
    description: str(formData, "description"),
    sku: str(formData, "sku"),
    brand: str(formData, "brand"),
    category: str(formData, "category"),
    size: str(formData, "size"),
    condition: str(formData, "condition") || "GOOD",
    costCents,
    purchasedAt: str(formData, "purchasedAt"),
    source: str(formData, "source"),
    quantity: str(formData, "quantity") || "1",
    status: str(formData, "status") || "ACTIVE",
    imageUrl: str(formData, "imageUrl"),
    notes: str(formData, "notes"),
  });
  return parsed.success ? { data: parsed.data } : { zodError: parsed.error };
}

export async function createItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const result = parseItemForm(formData);
  if ("error" in result) return { ok: false, error: result.error };
  if ("zodError" in result) return fieldError(result.zodError);

  await prisma.item.create({ data: { ...result.data, userId: user.id } });
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing item id" };

  const result = parseItemForm(formData);
  if ("error" in result) return { ok: false, error: result.error };
  if ("zodError" in result) return fieldError(result.zodError);

  // updateMany so ownership is enforced in the same statement.
  const { count } = await prisma.item.updateMany({
    where: { id, userId: user.id },
    data: result.data,
  });
  if (count === 0) return { ok: false, error: "Item not found" };

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteItem(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  await prisma.item.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
