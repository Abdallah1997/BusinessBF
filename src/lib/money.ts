/**
 * All money is handled as integer cents. These helpers are the only place
 * conversion to/from display strings happens.
 */

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}$${dollars.toLocaleString("en-US")}.${remainder.toString().padStart(2, "0")}`;
}

/**
 * Parse a user-entered dollar amount ("12.34", "$1,234.5", "12") into cents.
 * Returns null for anything that isn't a clean monetary value.
 */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const negative = cleaned.startsWith("-");
  const [whole, frac = ""] = cleaned.replace(/^-/, "").split(".");
  const cents = parseInt(whole, 10) * 100 + parseInt(frac.padEnd(2, "0") || "0", 10);
  if (!Number.isSafeInteger(cents)) return null;
  return negative ? -cents : cents;
}

export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
