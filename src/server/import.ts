"use server";

import { revalidatePath } from "next/cache";
import { csvToObjects } from "@/lib/csv";
import { parseDollarsToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { itemSchema } from "@/lib/validators";
import type { Prisma } from "@/generated/prisma/client";
import { ActionState } from "./action-helpers";

const MAX_FILE_BYTES = 1_000_000; // 1 MB
const MAX_ROWS = 2000;

/**
 * Import inventory from CSV. Expected headers (case-insensitive):
 * name, cost, quantity: plus optional sku, brand, category, size,
 * condition, purchased_at, source, notes.
 */
export async function importInventoryCsv(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a CSV file first" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "File too large (max 1 MB)" };
  }

  const text = await file.text();
  const rows = csvToObjects(text);
  if (rows.length === 0) return { ok: false, error: "No data rows found: is there a header row?" };
  if (rows.length > MAX_ROWS) return { ok: false, error: `Too many rows (max ${MAX_ROWS})` };

  const valid: Prisma.ItemCreateManyInput[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const costCents = row.cost ? parseDollarsToCents(row.cost) : 0;
    if (costCents === null) {
      errors.push(`Row ${idx + 2}: invalid cost "${row.cost}"`);
      return;
    }
    const condition = (row.condition || "GOOD").toUpperCase().replace(/[\s-]/g, "_");
    const parsed = itemSchema.safeParse({
      name: row.name ?? "",
      sku: row.sku ?? "",
      brand: row.brand ?? "",
      category: row.category ?? "",
      size: row.size ?? "",
      condition: ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].includes(condition) ? condition : "GOOD",
      costCents,
      purchasedAt: row.purchased_at ?? "",
      source: row.source ?? "",
      quantity: row.quantity || "1",
      status: "ACTIVE",
      notes: row.notes ?? "",
    });
    if (!parsed.success) {
      errors.push(`Row ${idx + 2}: ${parsed.error.issues[0].message}`);
      return;
    }
    valid.push({ ...parsed.data, userId: user.id });
  });

  if (valid.length === 0) {
    return { ok: false, error: errors[0] ?? "No valid rows to import" };
  }

  await prisma.item.createMany({ data: valid });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  if (errors.length > 0) {
    return { ok: false, error: `Imported ${valid.length} items; skipped ${errors.length}. First issue: ${errors[0]}` };
  }
  return { ok: true };
}
