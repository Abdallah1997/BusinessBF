"use server";

import { z } from "zod";
import { AI_NOT_CONFIGURED, aiExtract, isAiConfigured } from "@/lib/ai";
import { MARKETPLACE_LABELS, type Marketplace } from "@/lib/constants";
import { centsToInputValue } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { profitCents } from "@/lib/profit";
import { buildYearReport } from "@/lib/reports";
import { requireUser } from "@/lib/session";

export interface InsightsResult {
  ok: boolean;
  error?: string;
  insights?: string[];
}

const insightsSchema = z.object({
  insights: z.array(z.string().min(1).max(400)).min(1).max(6),
});

/** Generate short, actionable business insights from the user's own data. */
export async function generateInsights(): Promise<InsightsResult> {
  const user = await requireUser();

  if (!isAiConfigured()) return { ok: false, error: AI_NOT_CONFIGURED };

  const year = new Date().getFullYear();
  const [report, recentSales, staleListings, activeItems] = await Promise.all([
    buildYearReport(user.id, year),
    prisma.sale.findMany({
      where: { userId: user.id },
      orderBy: { soldAt: "desc" },
      take: 50,
      include: { item: { select: { name: true } } },
    }),
    prisma.listing.count({
      where: {
        userId: user.id,
        status: "ACTIVE",
        listedAt: { lt: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
      },
    }),
    prisma.item.count({ where: { userId: user.id, status: "ACTIVE" } }),
  ]);

  if (recentSales.length === 0 && activeItems === 0) {
    return { ok: false, error: "Add some inventory and sales first — insights need data" };
  }

  const salesLines = recentSales
    .map((s) => {
      const mp = MARKETPLACE_LABELS[s.marketplace as Marketplace] ?? s.marketplace;
      return `${s.soldAt.toISOString().slice(0, 10)} | ${s.item?.name ?? "unlinked"} | ${mp} | profit $${centsToInputValue(profitCents(s))}`;
    })
    .join("\n");

  try {
    const raw = await aiExtract({
      system:
        "You are a sharp business analyst for a small reselling business. " +
        "Given their real numbers, produce 3–5 specific, actionable insights. " +
        "Reference actual figures from the data. No platitudes ('keep up the good work'), " +
        "no invented numbers, no advice that ignores the data. Each insight is one or two sentences.",
      prompt:
        `Business data for ${year}:\n` +
        `Gross receipts: $${centsToInputValue(report.grossReceiptsCents)} across ${report.saleCount} sales\n` +
        `COGS: $${centsToInputValue(report.cogsCents)}\n` +
        `Fees: $${centsToInputValue(report.marketplaceFeesCents)} | Shipping costs: $${centsToInputValue(report.shippingCostsCents)}\n` +
        `Operating expenses: $${centsToInputValue(report.totalExpensesCents)}\n` +
        `Net profit: $${centsToInputValue(report.netProfitCents)}\n` +
        `Active inventory items: ${activeItems} | Listings active >30 days: ${staleListings}\n\n` +
        `Recent sales:\n${salesLines || "none"}`,
      toolName: "record_insights",
      toolDescription: "Record the business insights",
      inputSchema: {
        type: "object",
        properties: {
          insights: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
        },
        required: ["insights"],
      },
      maxTokens: 1500,
    });

    const parsed = insightsSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "Insight generation failed — try again" };
    return { ok: true, insights: parsed.data.insights };
  } catch {
    return { ok: false, error: "Insight generation failed — check your API key and try again" };
  }
}
