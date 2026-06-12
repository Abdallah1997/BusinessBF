import "server-only";

import { MODEL_FAST, aiExtract, isAiConfigured } from "@/lib/ai";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const MAX_AI_BATCH = 100;

interface AiClassification {
  index: number;
  suggestion: "EXPENSE" | "INVENTORY" | "IGNORE";
  category: string | null;
  item_name: string | null;
  confidence: number;
  rationale: string;
}

export interface SpendRow {
  id: string;
  date: Date;
  description: string;
  amountCents: number;
}

/**
 * Best-effort AI classification of imported spend transactions
 * (negative amounts). Rows stay PENDING either way; the user always
 * confirms before anything is booked. Shared by CSV import and Plaid sync.
 */
export async function classifySpends(transactions: SpendRow[]): Promise<void> {
  if (!isAiConfigured()) return;

  const spends = transactions.filter((t) => t.amountCents < 0).slice(0, MAX_AI_BATCH);
  if (spends.length === 0) return;

  try {
    const result = await aiExtract<{ classifications: AiClassification[] }>({
      model: MODEL_FAST,
      system:
        "You classify bank transactions for an online reseller's bookkeeping. " +
        "For each transaction decide: EXPENSE (business operating cost: shipping, supplies, fees, software, gas), " +
        "INVENTORY (buying goods to resell: thrift stores, auctions, wholesale, garage sales, retail arbitrage), " +
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
              aiCategory:
                c.category && (EXPENSE_CATEGORIES as readonly string[]).includes(c.category) ? c.category : null,
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
