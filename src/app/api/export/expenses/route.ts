import { NextRequest, NextResponse } from "next/server";
import { centsToInputValue } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { getUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const yearParam = Number.parseInt(request.nextUrl.searchParams.get("year") ?? "", 10);
  const year = Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100
    ? yearParam
    : new Date().getFullYear();

  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    orderBy: { date: "asc" },
  });

  const rows: string[][] = [
    ["date", "amount", "category", "vendor", "description"],
    ...expenses.map((e) => [
      e.date.toISOString().slice(0, 10),
      centsToInputValue(e.amountCents),
      e.category,
      e.vendor ?? "",
      e.description ?? "",
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="businessbf-expenses-${year}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
