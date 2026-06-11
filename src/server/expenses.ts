"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { expenseSchema, mileageSchema } from "@/lib/validators";
import { ActionState, dollarsField, fieldError, str } from "./action-helpers";

export async function createExpense(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const amountCents = dollarsField(formData, "amount", null);
  if (amountCents === null) return { ok: false, error: "Amount must be a valid dollar amount" };

  const parsed = expenseSchema.safeParse({
    date: str(formData, "date"),
    amountCents,
    category: str(formData, "category"),
    vendor: str(formData, "vendor"),
    description: str(formData, "description"),
  });
  if (!parsed.success) return fieldError(parsed.error);

  await prisma.expense.create({ data: { ...parsed.data, userId: user.id } });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateExpense(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = str(formData, "id");
  if (!id) return { ok: false, error: "Missing expense id" };

  const amountCents = dollarsField(formData, "amount", null);
  if (amountCents === null) return { ok: false, error: "Amount must be a valid dollar amount" };

  const parsed = expenseSchema.safeParse({
    date: str(formData, "date"),
    amountCents,
    category: str(formData, "category"),
    vendor: str(formData, "vendor"),
    description: str(formData, "description"),
  });
  if (!parsed.success) return fieldError(parsed.error);

  const { count } = await prisma.expense.updateMany({
    where: { id, userId: user.id },
    data: parsed.data,
  });
  if (count === 0) return { ok: false, error: "Expense not found" };

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  await prisma.expense.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}

export async function createMileage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = mileageSchema.safeParse({
    date: str(formData, "date"),
    miles: str(formData, "miles"),
    purpose: str(formData, "purpose"),
  });
  if (!parsed.success) return fieldError(parsed.error);

  await prisma.mileageEntry.create({ data: { ...parsed.data, userId: user.id } });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteMileage(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(formData, "id");
  if (!id) return;

  await prisma.mileageEntry.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
}
