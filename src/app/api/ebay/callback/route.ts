import { NextRequest, NextResponse } from "next/server";
import { encryptSecret } from "@/lib/crypto";
import { exchangeEbayCode, isEbayConfigured } from "@/lib/ebay";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/session";

/** Completes the eBay OAuth flow: verifies state, stores encrypted tokens. */
export async function GET(request: NextRequest) {
  const base = process.env.BETTER_AUTH_URL!;
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", base));
  if (!isEbayConfigured()) {
    return NextResponse.redirect(new URL("/connections?error=ebay-not-configured", base));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("ebay_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/connections?error=ebay-auth-failed", base));
  }

  try {
    const tokens = await exchangeEbayCode(code);
    await prisma.marketplaceConnection.upsert({
      where: { userId_marketplace: { userId: user.id, marketplace: "EBAY" } },
      create: {
        userId: user.id,
        marketplace: "EBAY",
        status: "CONNECTED",
        accessToken: encryptSecret(tokens.access_token),
        refreshToken: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : null,
        tokenExpires: new Date(Date.now() + tokens.expires_in * 1000),
      },
      update: {
        status: "CONNECTED",
        accessToken: encryptSecret(tokens.access_token),
        refreshToken: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : null,
        tokenExpires: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/connections?error=ebay-auth-failed", base));
  }

  const response = NextResponse.redirect(new URL("/connections?connected=ebay", base));
  response.cookies.delete("ebay_oauth_state");
  return response;
}
