"use server";

import { z } from "zod";
import { AI_NOT_CONFIGURED, aiExtract, isAiConfigured } from "@/lib/ai";
import { CONDITION_LABELS, type ItemCondition } from "@/lib/constants";
import { centsToInputValue } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { str } from "./action-helpers";

export interface GeneratedListing {
  ok: boolean;
  error?: string;
  data?: {
    title: string;
    brand: string;
    size: string;
    condition: string;
    measurements: string;
    flaws: string;
    description: string;
    hashtags: string;
    suggestedPriceDollars: string | null;
  };
}

const generatedSchema = z.object({
  title: z.string().min(1).max(120),
  condition_line: z.string().max(120).optional().default(""),
  description: z.string().min(1).max(3000),
  hashtags: z.string().max(300),
  suggested_price_dollars: z.number().min(0).max(1_000_000).nullable().optional(),
});

/** Generate marketplace-ready listing copy from an inventory item. */
export async function generateListing(formData: FormData): Promise<GeneratedListing> {
  const user = await requireUser();

  if (!isAiConfigured()) return { ok: false, error: AI_NOT_CONFIGURED };

  const itemId = str(formData, "itemId");
  if (!itemId) return { ok: false, error: "Pick an item first" };

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: user.id },
  });
  if (!item) return { ok: false, error: "Item not found" };

  const conditionLabel = CONDITION_LABELS[item.condition as ItemCondition] ?? item.condition;

  try {
    const raw = await aiExtract({
      system:
        "You write high-converting resale listings (eBay/Poshmark/Mercari style). " +
        "Write a keyword-rich title under 80 characters: brand first, then item type, key attributes, size. " +
        "Description: 2–4 short paragraphs, honest, scannable, leading with what makes the item desirable. " +
        "No invented details: only use what's provided. No ALL-CAPS hype, no 'L@@K'. " +
        "hashtags: 6–10 space-separated #tags buyers actually search. " +
        "suggested_price_dollars: a realistic resale price given the item and its cost, or null if you can't judge.",
      prompt:
        "Write a listing for this inventory item:\n" +
        `Name: ${item.name}\n` +
        `Brand: ${item.brand ?? "unknown"}\n` +
        `Category: ${item.category ?? "unknown"}\n` +
        `Size: ${item.size ?? "n/a"}\n` +
        `Condition: ${conditionLabel}\n` +
        `My cost: $${centsToInputValue(item.costCents)}\n` +
        `Notes: ${item.notes ?? "none"}`,
      toolName: "write_listing",
      toolDescription: "Record the generated listing copy",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Keyword-rich title, under 80 chars" },
          condition_line: { type: "string", description: "One-line condition statement" },
          description: { type: "string" },
          hashtags: { type: "string", description: "Space-separated #tags" },
          suggested_price_dollars: { type: ["number", "null"] },
        },
        required: ["title", "description", "hashtags"],
      },
      maxTokens: 2000,
    });

    const parsed = generatedSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "Generation failed: try again" };

    return {
      ok: true,
      data: {
        title: parsed.data.title,
        brand: item.brand ?? "",
        size: item.size ?? "",
        condition: parsed.data.condition_line || conditionLabel,
        measurements: "",
        flaws: "",
        description: parsed.data.description,
        hashtags: parsed.data.hashtags,
        suggestedPriceDollars:
          parsed.data.suggested_price_dollars != null
            ? parsed.data.suggested_price_dollars.toFixed(2)
            : null,
      },
    };
  } catch {
    return { ok: false, error: "Generation failed: check your API key and try again" };
  }
}
