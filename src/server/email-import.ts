"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AI_NOT_CONFIGURED, aiExtract, isAiConfigured } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { parseLocalDate } from "@/lib/validators";
import { ActionState, str } from "./action-helpers";

const MAX_TEXT_CHARS = 100_000;
const MAX_ITEMS = 50;

export interface ExtractedOrder {
  vendor: string | null;
  orderDate: string | null; // YYYY-MM-DD
  items: {
    name: string;
    brand: string | null;
    quantity: number;
    unitPriceDollars: string; // "12.50"
  }[];
}

export interface EmailExtractResult {
  ok: boolean;
  error?: string;
  data?: ExtractedOrder;
}

const extractedSchema = z.object({
  vendor: z.string().max(200).nullable().optional(),
  order_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        brand: z.string().max(100).nullable().optional(),
        quantity: z.number().int().min(1).max(1000),
        unit_price_dollars: z.number().min(0).max(1_000_000),
      }),
    )
    .max(MAX_ITEMS),
});

/** Parse a pasted purchase-confirmation email (or uploaded .eml/.txt) into order items. */
export async function extractOrderEmail(formData: FormData): Promise<EmailExtractResult> {
  await requireUser();

  if (!isAiConfigured()) return { ok: false, error: AI_NOT_CONFIGURED };

  let text = str(formData, "emailText").trim();
  const file = formData.get("emailFile");
  if (!text && file instanceof File && file.size > 0) {
    if (file.size > 1_000_000) return { ok: false, error: "File too large (max 1 MB)" };
    text = (await file.text()).trim();
  }
  if (!text) return { ok: false, error: "Paste the email text or upload a .eml/.txt file" };
  if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);

  try {
    const raw = await aiExtract({
      system:
        "You extract purchased items from order-confirmation emails for a reseller's inventory system. " +
        "The email may be raw .eml source with headers and HTML — ignore boilerplate, tracking pixels and footers. " +
        "Extract only actual purchased products with their prices. Dates must be YYYY-MM-DD. " +
        "unit_price_dollars is the per-unit price. Use null when information is absent — never invent.",
      prompt: `Extract the order details from this email:\n\n${text}`,
      toolName: "record_order",
      toolDescription: "Record the purchased items found in the email",
      inputSchema: {
        type: "object",
        properties: {
          vendor: { type: ["string", "null"], description: "Store/seller name" },
          order_date: { type: ["string", "null"], description: "YYYY-MM-DD" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                brand: { type: ["string", "null"] },
                quantity: { type: "integer", minimum: 1 },
                unit_price_dollars: { type: "number" },
              },
              required: ["name", "quantity", "unit_price_dollars"],
            },
          },
        },
        required: ["items"],
      },
      maxTokens: 4000,
    });

    const parsed = extractedSchema.safeParse(raw);
    if (!parsed.success || parsed.data.items.length === 0) {
      return { ok: false, error: "No purchased items found in this email" };
    }

    return {
      ok: true,
      data: {
        vendor: parsed.data.vendor ?? null,
        orderDate: parsed.data.order_date ?? null,
        items: parsed.data.items.map((i) => ({
          name: i.name,
          brand: i.brand ?? null,
          quantity: i.quantity,
          unitPriceDollars: i.unit_price_dollars.toFixed(2),
        })),
      },
    };
  } catch {
    return { ok: false, error: "Email parsing failed — check your API key and try again" };
  }
}

const importItemSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(100).nullable(),
  quantity: z.number().int().min(1).max(1000),
  costCents: z.number().int().min(0).max(100_000_000),
});

/** Create inventory items from the reviewed extraction. Payload re-validated server-side. */
export async function importExtractedItems(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  let payload: unknown;
  try {
    payload = JSON.parse(str(formData, "payload"));
  } catch {
    return { ok: false, error: "Invalid import payload" };
  }

  const schema = z.object({
    vendor: z.string().max(200).nullable(),
    orderDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    items: z.array(importItemSchema).min(1).max(MAX_ITEMS),
  });
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "Invalid import payload" };

  const purchasedAt = parsed.data.orderDate ? parseLocalDate(parsed.data.orderDate) : null;

  await prisma.item.createMany({
    data: parsed.data.items.map((i) => ({
      userId: user.id,
      name: i.name,
      brand: i.brand,
      quantity: i.quantity,
      costCents: i.costCents,
      purchasedAt,
      source: parsed.data.vendor,
      notes: "Imported from order-confirmation email",
    })),
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Save the user's import email address (display/forwarding reference only). */
export async function saveImportEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = z
    .union([z.literal(""), z.email("Enter a valid email address")])
    .safeParse(str(formData, "importEmail").trim());
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  await prisma.user.update({
    where: { id: user.id },
    data: { importEmailAddress: parsed.data === "" ? null : parsed.data },
  });

  revalidatePath("/email-import");
  return { ok: true };
}
