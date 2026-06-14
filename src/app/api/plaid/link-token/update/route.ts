import { NextRequest, NextResponse } from "next/server";
import { CountryCode } from "plaid";
import { z } from "zod";
import { decryptSecret } from "@/lib/crypto";
import { isPlaidConfigured, plaidClient, plaidWebhookUrl } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/session";

const bodySchema = z.object({
  bankAccountId: z.string().min(1).max(100),
  // When true, lets the user pick additional accounts (NEW_ACCOUNTS_AVAILABLE flow).
  accountSelection: z.boolean().optional(),
});

/**
 * Creates a Plaid Link token in UPDATE MODE for an already-connected Item, used
 * to re-authenticate a broken connection (ITEM_LOGIN_REQUIRED / PENDING_*) or to
 * add newly available accounts. No products are passed; the existing access
 * token identifies the Item.
 */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const account = await prisma.bankAccount.findFirst({
    where: { id: parsed.data.bankAccountId, userId: user.id, plaidAccessToken: { not: null } },
  });
  if (!account?.plaidAccessToken) {
    return NextResponse.json({ error: "Linked account not found" }, { status: 404 });
  }

  try {
    const webhook = plaidWebhookUrl();
    const { data } = await plaidClient().linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "BusinessBF",
      country_codes: [CountryCode.Us],
      language: "en",
      access_token: decryptSecret(account.plaidAccessToken),
      ...(webhook ? { webhook } : {}),
      ...(parsed.data.accountSelection ? { update: { account_selection_enabled: true } } : {}),
    });
    return NextResponse.json({ link_token: data.link_token });
  } catch {
    return NextResponse.json({ error: "Could not start reconnect" }, { status: 502 });
  }
}
