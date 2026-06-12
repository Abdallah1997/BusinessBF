"use server";

import { z } from "zod";
import { AI_NOT_CONFIGURED, aiExtract, isAiConfigured, type ImageInput } from "@/lib/ai";
import { requireUser } from "@/lib/session";

const MAX_IMAGE_BYTES = 5_000_000; // 5 MB

const ALLOWED_TYPES: Record<string, ImageInput["mediaType"]> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

export interface ReceiptScanResult {
  ok: boolean;
  error?: string;
  data?: {
    name: string;
    brand: string | null;
    category: string | null;
    cost: string; // dollars, e.g. "12.50"
    quantity: number;
    purchasedAt: string | null; // YYYY-MM-DD
    source: string | null;
    notes: string | null;
  };
}

const extractedSchema = z.object({
  item_name: z.string().min(1).max(200),
  brand: z.string().max(100).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  total_price_dollars: z.number().min(0).max(1_000_000),
  quantity: z.number().int().min(1).max(1000).optional(),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  store_name: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function scanReceipt(formData: FormData): Promise<ReceiptScanResult> {
  await requireUser();

  if (!isAiConfigured()) return { ok: false, error: AI_NOT_CONFIGURED };

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a receipt photo first" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image too large (max 5 MB)" };
  }
  const mediaType = ALLOWED_TYPES[file.type];
  if (!mediaType) {
    return { ok: false, error: "Use a JPEG, PNG or WebP image" };
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const raw = await aiExtract({
      system:
        "You extract purchase data from receipt photos for a reseller's inventory system. " +
        "Read the receipt carefully. If multiple line items exist, summarize the purchase as one inventory entry " +
        "using the most descriptive item name and the receipt total. Dates must be YYYY-MM-DD. " +
        "Use null for anything not visible on the receipt: never guess.",
      prompt: "Extract the purchase information from this receipt photo.",
      image: { mediaType, base64 },
      toolName: "record_receipt",
      toolDescription: "Record the extracted receipt data",
      inputSchema: {
        type: "object",
        properties: {
          item_name: { type: "string", description: "Descriptive name for the purchased item(s)" },
          brand: { type: ["string", "null"] },
          category: { type: ["string", "null"], description: "e.g. Shoes, Clothing, Electronics" },
          total_price_dollars: { type: "number", description: "Total paid in dollars, e.g. 12.5" },
          quantity: { type: "integer", minimum: 1 },
          purchase_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
          store_name: { type: ["string", "null"] },
          notes: { type: ["string", "null"], description: "Anything useful: line items, discounts" },
        },
        required: ["item_name", "total_price_dollars"],
      },
    });

    const parsed = extractedSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: "Could not read this receipt: try a clearer photo" };
    }
    const d = parsed.data;
    return {
      ok: true,
      data: {
        name: d.item_name,
        brand: d.brand ?? null,
        category: d.category ?? null,
        cost: d.total_price_dollars.toFixed(2),
        quantity: d.quantity ?? 1,
        purchasedAt: d.purchase_date ?? null,
        source: d.store_name ?? null,
        notes: d.notes ?? null,
      },
    };
  } catch {
    return { ok: false, error: "Receipt scan failed: check your API key and try again" };
  }
}
