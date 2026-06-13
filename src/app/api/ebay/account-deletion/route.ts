import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * eBay Marketplace Account Deletion / Closure notifications.
 *
 * Required for PRODUCTION keysets that access eBay user data. eBay validates the
 * endpoint with a GET challenge, then POSTs a notification whenever a user
 * closes their account or requests data deletion.
 *
 * Config:
 *   EBAY_VERIFICATION_TOKEN — a 32–80 char secret you also enter in the eBay
 *     developer console (Alerts & Notifications → Marketplace Account Deletion).
 *   BETTER_AUTH_URL — used to reconstruct the exact endpoint URL eBay expects in
 *     the challenge hash. Must match the URL registered in the console.
 *
 * Docs: https://developer.ebay.com/marketplace-account-deletion
 */

function endpointUrl(): string {
  return `${process.env.BETTER_AUTH_URL}/api/ebay/account-deletion`;
}

// GET: endpoint validation. eBay sends ?challenge_code=... and expects back
// { challengeResponse: sha256(challengeCode + verificationToken + endpoint) }.
export async function GET(request: NextRequest) {
  const challengeCode = request.nextUrl.searchParams.get("challenge_code");
  const token = process.env.EBAY_VERIFICATION_TOKEN;
  if (!challengeCode || !token) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }
  const hash = createHash("sha256");
  hash.update(challengeCode);
  hash.update(token);
  hash.update(endpointUrl());
  return NextResponse.json({ challengeResponse: hash.digest("hex") }, { status: 200 });
}

// POST: account-deletion notification. Acknowledge fast (200) so eBay does not
// retry, and best-effort purge that user's stored eBay tokens.
export async function POST(request: NextRequest) {
  let body: { notification?: { data?: { username?: string; userId?: string } } } | null = null;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  const username = body?.notification?.data?.username ?? body?.notification?.data?.userId ?? null;
  if (username) {
    try {
      await prisma.marketplaceConnection.deleteMany({
        where: { marketplace: "EBAY", externalUser: String(username) },
      });
    } catch {
      // Must still return 200; eBay treats non-2xx as a failure and retries.
    }
  }
  return new NextResponse(null, { status: 200 });
}
