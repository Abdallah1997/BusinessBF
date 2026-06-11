import { parseDollarsToCents } from "@/lib/money";
import { z } from "zod";

export type ActionState = {
  ok: boolean;
  error?: string;
} | null;

export function fieldError(error: z.ZodError): ActionState {
  const first = error.issues[0];
  const path = first.path.join(".");
  return { ok: false, error: path ? `${path}: ${first.message}` : first.message };
}

/**
 * Read a dollar-amount form field and convert to cents.
 * Empty/missing fields fall back to `fallback` (default 0).
 */
export function dollarsField(
  formData: FormData,
  name: string,
  fallback: number | null = 0,
): number | null {
  const raw = formData.get(name);
  if (typeof raw !== "string" || raw.trim() === "") return fallback;
  return parseDollarsToCents(raw);
}

export function str(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}
