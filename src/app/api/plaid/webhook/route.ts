import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { decodeProtectedHeader, importJWK, jwtVerify } from "jose";
import { isPlaidConfigured, plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";

/**
 * Plaid Item/Transactions webhook receiver.
 *
 * Security: Plaid signs each webhook with an ES256 JWT in the `Plaid-Verification`
 * header. We verify the signature against Plaid's published key, confirm the
 * body hash matches, and reject anything older than 5 minutes (replay) before
 * trusting the payload. Docs: https://plaid.com/docs/api/webhooks/webhook-verification
 *
 * Handles:
 *  - ITEM_LOGIN_REQUIRED / PENDING_EXPIRATION / PENDING_DISCONNECT -> flag reauth
 *  - LOGIN_REPAIRED -> clear reauth flag
 *  - NEW_ACCOUNTS_AVAILABLE -> flag new accounts available
 *  - USER_PERMISSION_REVOKED / USER_ACCOUNT_REVOKED -> offboarding: purge tokens
 */

async function verify(rawBody: string, jwt: string | null): Promise<boolean> {
  if (!jwt) return false;
  try {
    const { kid, alg } = decodeProtectedHeader(jwt);
    if (alg !== "ES256" || !kid) return false;
    const { data } = await plaidClient().webhookVerificationKeyGet({ key_id: kid });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const publicKey = await importJWK(data.key as any, "ES256");
    const { payload } = await jwtVerify(jwt, publicKey, {
      algorithms: ["ES256"],
      maxTokenAge: "5m",
    });
    const bodyHash = createHash("sha256").update(rawBody, "utf8").digest("hex");
    return payload.request_body_sha256 === bodyHash;
  } catch {
    return false;
  }
}

async function setReauth(itemId: string, value: boolean) {
  await prisma.bankAccount.updateMany({
    where: { plaidItemId: itemId },
    data: { reauthRequired: value },
  });
}

export async function POST(request: NextRequest) {
  // Nothing to verify against if Plaid is not configured; ack so Plaid stops retrying.
  if (!isPlaidConfigured()) return new NextResponse(null, { status: 200 });

  const rawBody = await request.text();
  const verified = await verify(rawBody, request.headers.get("plaid-verification"));
  if (!verified) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let body: { webhook_type?: string; webhook_code?: string; item_id?: string; error?: { error_code?: string } };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  const itemId = body.item_id;
  const code = body.webhook_code;
  if (itemId && code) {
    switch (code) {
      case "ERROR":
        if (body.error?.error_code === "ITEM_LOGIN_REQUIRED") await setReauth(itemId, true);
        break;
      case "PENDING_EXPIRATION":
      case "PENDING_DISCONNECT":
        await setReauth(itemId, true);
        break;
      case "LOGIN_REPAIRED":
        await setReauth(itemId, false);
        break;
      case "NEW_ACCOUNTS_AVAILABLE":
        await prisma.bankAccount.updateMany({
          where: { plaidItemId: itemId },
          data: { newAccountsAvailable: true },
        });
        break;
      case "USER_PERMISSION_REVOKED":
      case "USER_ACCOUNT_REVOKED":
        // Offboarding: the user revoked access at the bank. Delete the stored
        // access token + account metadata for this Item.
        await prisma.bankAccount.deleteMany({ where: { plaidItemId: itemId } });
        break;
      default:
        // SYNC_UPDATES_AVAILABLE and others: no action (users sync on demand).
        break;
    }
  }

  return new NextResponse(null, { status: 200 });
}
