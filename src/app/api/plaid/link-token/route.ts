import { NextResponse } from "next/server";
import { CountryCode, Products } from "plaid";
import { isPlaidConfigured, plaidClient, plaidWebhookUrl } from "@/lib/plaid";
import { rateLimited } from "@/lib/rate-limit";
import { getUser } from "@/lib/session";

export async function POST(request: Request) {
  const limited = rateLimited(request, "plaid-link-token", 10, 60_000);
  if (limited) return limited;

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured" }, { status: 503 });
  }

  try {
    const webhook = plaidWebhookUrl();
    const { data } = await plaidClient().linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "BusinessBF",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
      ...(webhook ? { webhook } : {}),
    });
    return NextResponse.json({ link_token: data.link_token });
  } catch {
    return NextResponse.json({ error: "Could not create link token" }, { status: 502 });
  }
}
