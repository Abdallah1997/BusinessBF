"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MODEL_FAST, aiExtract, isAiConfigured } from "@/lib/ai";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { csvToObjects } from "@/lib/csv";
import { parseDollarsToCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { parseLocalDate } from "@/lib/validators";
import { ActionState, fieldError, str } from "./action-helpers";

// ---------- Accounts (metadata only — never credentials) ----------

const accountSchema = z.object({
  nickname: z.string().trim().min(1, "Nickname is required").max(100),
  institution: z
    .string()
    .trim()
    .max(100)
    .transform((v) => (v === "" ? null : v)),
  last4: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || /^\d{4}$/.test(v), "Last 4 must be exactly 4 digits"),
});

export async function createBankAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = accountSchema.safeParse({
    nickname: str(formData, "nickname"),
    institution: str(formData, "institution"),
    last4: str(formData, "last4"),
  });
  if (!parsed.success) return fieldError(parsed.error);

  await prisma.bankAccount.create({ data: { ...parsed.data, userId: user.id } });
  revalidatePath("/bank");
  return { ok: true };
}

export async function deleteBankAccount(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(formData, "id");
  if (!id) return;
  await prisma.bankAccount.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/bank");
}

// ---------- Transaction import + AI classification ----------

const MAX_FILE_BYTES = 1_000_000;
const MAX_ROWS = 500;
const MAX_AI_BATCH = 100;

interface AiClassification {
  index: number;
  suggestion: "EXPENSE" | "INVENTORY" | "IGNORE";
  category: string | null;
  item_name: string | null;
  confidence: number;
  rationale: string;
}

/**
 * Import a bank-statement CSV (headers: date, description, amount) and let AI
 * suggest whether each spend is a business expense, an inventory purchase, or
 * personal/ignorable. Nothing is booked until the user confirms each row.
 */
export async function importBankCsv(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const bankAccountId = str(formData, "bankAccountId") || null;
  if (bankAccountId) {
    const account = await prisma.bankAccount.findFirst({
      where: { id: bankAccountId, userId: user.id },
      select: { id: true },
    });
    if (!account) return { ok: false, error: "Bank account not found" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a CSV file first" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "File too large (max 1 MB)" };

  const rows = csvToObjects(await file.text());
  if (rows.length === 0) return { ok: false, error: "No data rows found — header row required (date, description, amount)" };
  if (rows.length > MAX_ROWS) return { ok: false, error: `Too many rows (max ${MAX_ROWS})` };

  const parsedRows: { date: Date; description: string; amountCents: number }[] = [];
  for (const [idx, row] of rows.entries()) {
    const date = parseLocalDate(row.date ?? "");
    const amountCents = parseDollarsToCents(row.amount ?? "");
    const description = (row.description ?? "").slice(0, 500);
    if (Number.isNaN(date.getTime()) || amountCents === null || !description) {
      return { ok: false, error: `Row ${idx + 2}: needs valid date, description and amount` };
    }
    parsedRows.push({ date, description, amountCents });
  }

  const created = await prisma.$transaction(
    parsedRows.map((r) =>
      prisma.bankTransaction.create({
        data: { ...r, userId: user.id, bankAccountId },
        select: { id: true, date: true, description: true, amountCents: true },
      }),
    ),
  );

  // AI pass: classify spends (negative amounts). Income rows stay unsuggested.
  if (isAiConfigured()) {
    const spends = created.filter((t) => t.amountCents < 0).slice(0, MAX_AI_BATCH);
    if (spends.length > 0) {
      try {
        const result = await aiExtract<{ classifications: AiClassification[] }>({
          model: MODEL_FAST,
          system:
            "You classify bank transactions for an online reseller's bookkeeping. " +
            "For each transaction decide: EXPENSE (business operating cost — shipping, supplies, fees, software, gas), " +
            "INVENTORY (buying goods to resell — thrift stores, auctions, wholesale, garage sales, retail arbitrage), " +
            "or IGNORE (personal spending: groceries, restaurants, rent, entertainment, transfers). " +
            `For EXPENSE also pick the best category from: ${EXPENSE_CATEGORIES.join(", ")}. ` +
            "For INVENTORY also produce a short item_name from the merchant (e.g. 'Goodwill haul'). " +
            "confidence is 0 to 1. Be conservative: when unsure, prefer IGNORE with low confidence.",
          prompt:
            "Classify these transactions (amounts are negative dollars = money spent):\n\n" +
            spends
              .map(
                (t, i) =>
                  `${i}. ${t.date.toISOString().slice(0, 10)} | ${t.description} | $${(t.amountCents / 100).toFixed(2)}`,
              )
              .join("\n"),
          toolName: "classify_transactions",
          toolDescription: "Record the classification for every transaction by index",
          inputSchema: {
            type: "object",
            properties: {
              classifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "integer" },
                    suggestion: { type: "string", enum: ["EXPENSE", "INVENTORY", "IGNORE"] },
                    category: { type: ["string", "null"], enum: [...EXPENSE_CATEGORIES, null] },
                    item_name: { type: ["string", "null"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    rationale: { type: "string" },
                  },
                  required: ["index", "suggestion", "confidence", "rationale"],
                },
              },
            },
            required: ["classifications"],
          },
          maxTokens: 8000,
        });

        await prisma.$transaction(
          result.classifications
            .filter((c) => Number.isInteger(c.index) && c.index >= 0 && c.index < spends.length)
            .map((c) =>
              prisma.bankTransaction.update({
                where: { id: spends[c.index].id },
                data: {
                  aiSuggestion: ["EXPENSE", "INVENTORY", "IGNORE"].includes(c.suggestion) ? c.suggestion : null,
                  aiCategory: c.category && (EXPENSE_CATEGORIES as readonly string[]).includes(c.category) ? c.category : null,
                  aiItemName: c.item_name?.slice(0, 200) ?? null,
                  aiConfidence: Math.max(0, Math.min(1, c.confidence)),
                  aiRationale: c.rationale?.slice(0, 500) ?? null,
                },
              }),
            ),
        );
      } catch {
        // Classification is best-effort; rows stay PENDING for manual review.
      }
    }
  }

  revalidatePath("/bank");
  return { ok: true };
}

// ---------- Review queue ----------

export async function confirmTransaction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(formData, "id");
  const kind = str(formData, "kind"); // EXPENSE | INVENTORY
  const category = str(formData, "category");

  if (!id || !["EXPENSE", "INVENTORY"].includes(kind)) return;

  const txn = await prisma.bankTransaction.findFirst({
    where: { id, userId: user.id, status: "PENDING" },
  });
  if (!txn) return;

  const amountCents = Math.abs(txn.amountCents);

  if (kind === "EXPENSE") {
    const cat = (EXPENSE_CATEGORIES as readonly string[]).includes(category)
      ? category
      : txn.aiCategory ?? "OTHER";
    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        date: txn.date,
        amountCents,
        category: cat,
        vendor: txn.description.slice(0, 200),
        description: "Imported from bank transaction",
      },
    });
    await prisma.bankTransaction.updateMany({
      where: { id, userId: user.id },
      data: { status: "CONFIRMED", linkedExpenseId: expense.id },
    });
  } else {
    const item = await prisma.item.create({
      data: {
        userId: user.id,
        name: (txn.aiItemName ?? txn.description).slice(0, 200),
        costCents: amountCents,
        purchasedAt: txn.date,
        source: txn.description.slice(0, 200),
        notes: "Imported from bank transaction — update details after sorting the haul",
      },
    });
    await prisma.bankTransaction.updateMany({
      where: { id, userId: user.id },
      data: { status: "CONFIRMED", linkedItemId: item.id },
    });
  }

  revalidatePath("/bank");
  revalidatePath("/expenses");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function dismissTransaction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = str(formData, "id");
  if (!id) return;
  await prisma.bankTransaction.updateMany({
    where: { id, userId: user.id, status: "PENDING" },
    data: { status: "DISMISSED" },
  });
  revalidatePath("/bank");
}
