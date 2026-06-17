import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

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

// POST: account-deletion notification. We only acknowledge (200) — we do NOT
// take any destructive action from this endpoint.
//
// Why acknowledge-only: this request is unauthenticated from our side, and
// acting on its (attacker-spoofable) body to delete records would be an
// unauthenticated destructive action. eBay signs these notifications
// (x-ebay-signature), but verifying that requires fetching eBay's public key
// and validating the signature; until that's implemented we must not trust the
// payload. We also don't store eBay *consumer* PII to erase — the only eBay
// data we keep is an OAuth token tied to OUR app user, which that user removes
// themselves via Disconnect (which calls the eBay revoke flow). So there is
// nothing to delete in response to this notification today.
//
// TODO (if we ever store eBay user identifiers): verify x-ebay-signature
// against eBay's published key, then erase the matching records.
export async function POST() {
  return new NextResponse(null, { status: 200 });
}
