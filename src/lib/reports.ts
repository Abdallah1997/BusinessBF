import { MILEAGE_RATE_CENTS_PER_MILE, type ExpenseCategory } from "./constants";
import { prisma } from "./prisma";
import { grossCents } from "./profit";

export interface YearReport {
  year: number;
  grossReceiptsCents: number;
  cogsCents: number;
  grossProfitCents: number;
  marketplaceFeesCents: number; // from sales
  shippingCostsCents: number; // from sales
  otherSaleCostsCents: number; // from sales
  expensesByCategory: Partial<Record<ExpenseCategory, number>>;
  totalExpensesCents: number;
  totalMiles: number;
  mileageDeductionCents: number;
  netProfitCents: number;
  saleCount: number;
}

export async function buildYearReport(userId: string, year: number): Promise<YearReport> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const [sales, expenses, mileage] = await Promise.all([
    prisma.sale.findMany({
      where: { userId, soldAt: { gte: start, lt: end } },
      select: {
        salePriceCents: true,
        shippingChargedCents: true,
        feesCents: true,
        shippingCostCents: true,
        otherCostCents: true,
        costOfGoodsCents: true,
      },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { amountCents: true, category: true },
    }),
    prisma.mileageEntry.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { miles: true },
    }),
  ]);

  const grossReceiptsCents = sales.reduce((sum, s) => sum + grossCents(s), 0);
  const cogsCents = sales.reduce((sum, s) => sum + s.costOfGoodsCents, 0);
  const marketplaceFeesCents = sales.reduce((sum, s) => sum + s.feesCents, 0);
  const shippingCostsCents = sales.reduce((sum, s) => sum + s.shippingCostCents, 0);
  const otherSaleCostsCents = sales.reduce((sum, s) => sum + s.otherCostCents, 0);

  const expensesByCategory: Partial<Record<ExpenseCategory, number>> = {};
  for (const e of expenses) {
    const key = e.category as ExpenseCategory;
    expensesByCategory[key] = (expensesByCategory[key] ?? 0) + e.amountCents;
  }
  const totalExpensesCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  const totalMiles = mileage.reduce((sum, m) => sum + m.miles, 0);
  const mileageDeductionCents = Math.round(totalMiles * MILEAGE_RATE_CENTS_PER_MILE);

  const grossProfitCents = grossReceiptsCents - cogsCents;
  const netProfitCents =
    grossProfitCents -
    marketplaceFeesCents -
    shippingCostsCents -
    otherSaleCostsCents -
    totalExpensesCents -
    mileageDeductionCents;

  return {
    year,
    grossReceiptsCents,
    cogsCents,
    grossProfitCents,
    marketplaceFeesCents,
    shippingCostsCents,
    otherSaleCostsCents,
    expensesByCategory,
    totalExpensesCents,
    totalMiles,
    mileageDeductionCents,
    netProfitCents,
    saleCount: sales.length,
  };
}
