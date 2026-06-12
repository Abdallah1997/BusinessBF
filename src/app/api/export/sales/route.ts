import { NextRequest, NextResponse } from "next/server";
import { centsToInputValue } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { profitCents } from "@/lib/profit";
import { toCsv } from "@/lib/csv";
import { getUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const yearParam = Number.parseInt(request.nextUrl.searchParams.get("year") ?? "", 10);
  const year = Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100
    ? yearParam
    : new Date().getFullYear();

  const sales = await prisma.sale.findMany({
    where: {
      userId: user.id,
      soldAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    orderBy: { soldAt: "asc" },
    include: { item: { select: { name: true, sku: true } } },
  });

  const rows: (string | number)[][] = [
    ["date", "item", "sku", "marketplace", "sale_price", "shipping_charged", "fees", "shipping_cost", "other_cost", "cost_of_goods", "profit", "notes"],
    ...sales.map((s) => [
      s.soldAt.toISOString().slice(0, 10),
      s.item?.name ?? "",
      s.item?.sku ?? "",
      s.marketplace,
      centsToInputValue(s.salePriceCents),
      centsToInputValue(s.shippingChargedCents),
      centsToInputValue(s.feesCents),
      centsToInputValue(s.shippingCostCents),
      centsToInputValue(s.otherCostCents),
      centsToInputValue(s.costOfGoodsCents),
      centsToInputValue(profitCents(s)),
      s.notes ?? "",
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="businessbf-sales-${year}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
