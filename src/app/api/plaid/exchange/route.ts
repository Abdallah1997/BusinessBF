import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encryptSecret } from "@/lib/crypto";
import { isPlaidConfigured, plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { rateLimited } from "@/lib/rate-limit";
import { getUser } from "@/lib/session";

const bodySchema = z.object({
  public_token: z.string().min(1).max(500),
});

/**
 * Completes Plaid Link: exchanges the public token for an access token,
 * stores it encrypted, and creates one BankAccount row per linked account.
 */
export async function POST(request: NextRequest) {
  const limited = rateLimited(request, "plaid-exchange", 10, 60_000);
  if (limited) return limited;

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  try {
    const client = plaidClient();
    const exchange = await client.itemPublicTokenExchange({
      public_token: parsed.data.public_token,
    });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    const accountsRes = await client.accountsGet({ access_token: accessToken });
    const institution = accountsRes.data.item.institution_name ?? null;

    const encrypted = encryptSecret(accessToken);
    await prisma.$transaction(
      accountsRes.data.accounts.map((a) =>
        prisma.bankAccount.create({
          data: {
            userId: user.id,
            nickname: a.name,
            institution,
            last4: a.mask,
            plaidItemId: itemId,
            plaidAccountId: a.account_id,
            plaidAccessToken: encrypted,
          },
        }),
      ),
    );

    return NextResponse.json({ ok: true, accounts: accountsRes.data.accounts.length });
  } catch {
    return NextResponse.json({ error: "Bank linking failed" }, { status: 502 });
  }
}
