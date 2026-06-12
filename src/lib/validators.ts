import { z } from "zod";
import {
  EXPENSE_CATEGORIES,
  ITEM_CONDITIONS,
  ITEM_STATUSES,
  LISTING_STATUSES,
  MARKETPLACES,
} from "./constants";

// Money comes from forms as dollar strings; coerce + bound-check as cents.
const centsField = z.coerce
  .number()
  .int("Amount must be a whole number of cents")
  .min(0, "Amount cannot be negative")
  .max(100_000_000, "Amount is unreasonably large"); // $1,000,000 cap

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

// Date-only strings ("2026-06-11") must be parsed as LOCAL dates: new Date()
// would treat them as UTC midnight and display the previous day in the US.
export function parseLocalDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? parseLocalDate(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid date");

export const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: optionalTrimmed(5000),
  sku: optionalTrimmed(100),
  brand: optionalTrimmed(100),
  category: optionalTrimmed(100),
  size: optionalTrimmed(50),
  condition: z.enum(ITEM_CONDITIONS),
  costCents: centsField,
  purchasedAt: optionalDate,
  source: optionalTrimmed(200),
  quantity: z.coerce.number().int().min(1).max(100_000),
  status: z.enum(ITEM_STATUSES).default("ACTIVE"),
  imageUrl: z
    .union([z.literal(""), z.url("Image must be a valid URL").max(2000)])
    .optional()
    .transform((v) => (v ? v : null)),
  notes: optionalTrimmed(5000),
});

export const listingSchema = z.object({
  itemId: z.string().min(1, "Item is required"),
  marketplace: z.enum(MARKETPLACES),
  priceCents: centsField,
  url: z
    .union([z.literal(""), z.url("Listing URL must be a valid URL").max(2000)])
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(LISTING_STATUSES).default("ACTIVE"),
});

export const saleSchema = z.object({
  itemId: optionalTrimmed(50),
  listingId: optionalTrimmed(50),
  marketplace: z.enum(MARKETPLACES),
  soldAt: z
    .string()
    .trim()
    .min(1, "Sale date is required")
    .transform((v) => parseLocalDate(v))
    .refine((d) => !Number.isNaN(d.getTime()), "Invalid date"),
  salePriceCents: centsField,
  shippingChargedCents: centsField.default(0),
  feesCents: centsField.default(0),
  shippingCostCents: centsField.default(0),
  otherCostCents: centsField.default(0),
  notes: optionalTrimmed(5000),
});

export const expenseSchema = z.object({
  date: z
    .string()
    .trim()
    .min(1, "Date is required")
    .transform((v) => parseLocalDate(v))
    .refine((d) => !Number.isNaN(d.getTime()), "Invalid date"),
  amountCents: centsField,
  category: z.enum(EXPENSE_CATEGORIES),
  vendor: optionalTrimmed(200),
  description: optionalTrimmed(2000),
});

export const mileageSchema = z.object({
  date: z
    .string()
    .trim()
    .min(1, "Date is required")
    .transform((v) => parseLocalDate(v))
    .refine((d) => !Number.isNaN(d.getTime()), "Invalid date"),
  miles: z.coerce.number().positive("Miles must be positive").max(10_000),
  purpose: optionalTrimmed(500),
});

export type ItemInput = z.infer<typeof itemSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type MileageInput = z.infer<typeof mileageSchema>;
