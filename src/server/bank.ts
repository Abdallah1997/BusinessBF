"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { decryptSecret } from "@/lib/crypto";
import { csvToObjects } from "@/lib/csv";
import { parseDollarsToCents } from "@/lib/money";
import { isPlaidConfigured, plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { parseLocalDate } from "@/lib/validators";
import { ActionState, fieldError, str } from "./action-helpers";
import { classifySpends } from "./bank-classify";

// ---------- Accounts (metadata only: never credentials) ----------

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
  if (rows.length === 0) return { ok: false, error: "No data rows found: header row required (date, description, amount)" };
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
  await classifySpends(created);

  revalidatePath("/bank");
  return { ok: true };
}

// ---------- Plaid sync ----------

/**
 * Pull new transactions for a Plaid-linked account via /transactions/sync
 * and feed them into the same AI-classify review queue as CSV imports.
 */
export async function syncPlaidAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  if (!isPlaidConfigured()) {
    return { ok: false, error: "Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to .env." };
  }

  const id = str(formData, "id");
  const account = await prisma.bankAccount.findFirst({
    where: { id, userId: user.id, plaidAccessToken: { not: null } },
  });
  if (!account || !account.plaidAccessToken) return { ok: false, error: "Linked account not found" };

  try {
    const accessToken = decryptSecret(account.plaidAccessToken);
    let cursor = account.plaidCursor ?? undefined;
    const added: { date: Date; description: string; amountCents: number }[] = [];

    // Walk the sync stream to the end.
    for (let page = 0; page < 20; page++) {
      const { data } = await plaidClient().transactionsSync({
        access_token: accessToken,
        cursor,
        count: 250,
      });
      for (const t of data.added) {
        if (account.plaidAccountId && t.account_id !== account.plaidAccountId) continue;
        added.push({
          date: parseLocalDate(t.date),
          description: (t.merchant_name || t.name || "Transaction").slice(0, 500),
          // Plaid: positive = money out. Ours: negative = money out.
          amountCents: -Math.round(t.amount * 100),
        });
      }
      cursor = data.next_cursor;
      if (!data.has_more) break;
    }

    const created = await prisma.$transaction(
      added.map((r) =>
        prisma.bankTransaction.create({
          data: { ...r, userId: user.id, bankAccountId: account.id },
          select: { id: true, date: true, description: true, amountCents: true },
        }),
      ),
    );
    await prisma.bankAccount.update({
      where: { id: account.id },
      data: { plaidCursor: cursor ?? null },
    });

    await classifySpends(created);

    revalidatePath("/bank");
    return added.length === 0
      ? { ok: false, error: "Already up to date: no new transactions" }
      : { ok: true };
  } catch {
    return { ok: false, error: "Plaid sync failed. Reconnect the account and try again." };
  }
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
        notes: "Imported from bank transaction: update details after sorting the haul",
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
