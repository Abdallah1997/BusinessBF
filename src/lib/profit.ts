/**
 * Pure profit math, unit-tested in isolation. All values are integer cents.
 */

export interface SaleFinancials {
  salePriceCents: number;
  shippingChargedCents: number;
  feesCents: number;
  shippingCostCents: number;
  otherCostCents: number;
  costOfGoodsCents: number;
}

/** Gross revenue: what the buyer paid in total. */
export function grossCents(s: SaleFinancials): number {
  return s.salePriceCents + s.shippingChargedCents;
}

/** Net profit after fees, shipping, packaging and cost of goods. */
export function profitCents(s: SaleFinancials): number {
  return (
    grossCents(s) -
    s.feesCents -
    s.shippingCostCents -
    s.otherCostCents -
    s.costOfGoodsCents
  );
}

/** Profit margin as a fraction of gross revenue (0 when there is no revenue). */
export function marginFraction(s: SaleFinancials): number {
  const gross = grossCents(s);
  if (gross === 0) return 0;
  return profitCents(s) / gross;
}

/** Return on investment relative to cost of goods (null when COG is 0). */
export function roiFraction(s: SaleFinancials): number | null {
  if (s.costOfGoodsCents === 0) return null;
  return profitCents(s) / s.costOfGoodsCents;
}
