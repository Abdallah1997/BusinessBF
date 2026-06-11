import { NextResponse } from "next/server";
import { centsToInputValue } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";
import { getUser } from "@/lib/session";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.item.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  const rows: (string | number)[][] = [
    ["name", "sku", "brand", "category", "size", "condition", "cost", "quantity", "purchased_at", "source", "status", "notes"],
    ...items.map((i) => [
      i.name,
      i.sku ?? "",
      i.brand ?? "",
      i.category ?? "",
      i.size ?? "",
      i.condition,
      centsToInputValue(i.costCents),
      i.quantity,
      i.purchasedAt ? i.purchasedAt.toISOString().slice(0, 10) : "",
      i.source ?? "",
      i.status,
      i.notes ?? "",
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="flipledger-inventory.csv"',
      "Cache-Control": "no-store",
    },
  });
}
