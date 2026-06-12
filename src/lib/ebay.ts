import "server-only";

import { decryptSecret, encryptSecret } from "./crypto";
import { prisma } from "./prisma";

/**
 * eBay OAuth + API client. Configure with:
 *   EBAY_CLIENT_ID, EBAY_CLIENT_SECRET: from https://developer.ebay.com
 *   EBAY_RU_NAME: the RuName (redirect URL name) of your eBay app
 *   EBAY_ENV: sandbox | production (default sandbox)
 *   ENCRYPTION_KEY: required to store tokens
 *
 * Your eBay app's accepted redirect must point at /api/ebay/callback.
 */

const SCOPES = [
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
].join(" ");

export function isEbayConfigured(): boolean {
  return Boolean(
    process.env.EBAY_CLIENT_ID &&
      process.env.EBAY_CLIENT_SECRET &&
      process.env.EBAY_RU_NAME &&
      process.env.ENCRYPTION_KEY,
  );
}

function isSandbox(): boolean {
  return (process.env.EBAY_ENV ?? "sandbox") !== "production";
}

export function authBase(): string {
  return isSandbox() ? "https://auth.sandbox.ebay.com" : "https://auth.ebay.com";
}

export function apiBase(): string {
  return isSandbox() ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
}

export function buildEbayAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.EBAY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.EBAY_RU_NAME!,
    scope: SCOPES,
    state,
  });
  return `${authBase()}/oauth2/authorize?${params}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const basic = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch(`${apiBase()}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`eBay token request failed (${res.status})`);
  return res.json();
}

export async function exchangeEbayCode(code: string): Promise<TokenResponse> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.EBAY_RU_NAME!,
    }),
  );
}

async function refreshEbayToken(refreshToken: string): Promise<TokenResponse> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: SCOPES,
    }),
  );
}

/**
 * Returns a valid (auto-refreshed) eBay access token for the user,
 * or null if not connected.
 */
export async function ebayAccessTokenFor(userId: string): Promise<string | null> {
  const conn = await prisma.marketplaceConnection.findUnique({
    where: { userId_marketplace: { userId, marketplace: "EBAY" } },
  });
  if (!conn?.accessToken) return null;

  const stillValid =
    conn.tokenExpires && conn.tokenExpires.getTime() > Date.now() + 60_000;
  if (stillValid) return decryptSecret(conn.accessToken);

  if (!conn.refreshToken) return null;
  try {
    const refreshed = await refreshEbayToken(decryptSecret(conn.refreshToken));
    await prisma.marketplaceConnection.update({
      where: { id: conn.id },
      data: {
        accessToken: encryptSecret(refreshed.access_token),
        tokenExpires: new Date(Date.now() + refreshed.expires_in * 1000),
        status: "CONNECTED",
      },
    });
    return refreshed.access_token;
  } catch {
    await prisma.marketplaceConnection.update({
      where: { id: conn.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }
}

export interface EbayActiveListing {
  itemId: string;
  title: string;
  priceCents: number;
  url: string | null;
}

/**
 * Fetch the user's active listings via the Trading API (GetMyeBaySelling),
 * which covers listings created anywhere (app, web, mobile).
 */
export async function fetchEbayActiveListings(accessToken: string): Promise<EbayActiveListing[]> {
  const xmlRequest =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">` +
    `<ActiveList><Include>true</Include><Pagination><EntriesPerPage>200</EntriesPerPage><PageNumber>1</PageNumber></Pagination></ActiveList>` +
    `</GetMyeBaySellingRequest>`;

  const res = await fetch(`${apiBase()}/ws/api.dll`, {
    method: "POST",
    headers: {
      "X-EBAY-API-CALL-NAME": "GetMyeBaySelling",
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1193",
      "X-EBAY-API-IAF-TOKEN": accessToken,
      "Content-Type": "text/xml",
    },
    body: xmlRequest,
  });
  if (!res.ok) throw new Error(`eBay listing fetch failed (${res.status})`);
  const xml = await res.text();

  const listings: EbayActiveListing[] = [];
  const itemBlocks = xml.match(/<Item>[\s\S]*?<\/Item>/g) ?? [];
  for (const block of itemBlocks) {
    const itemId = block.match(/<ItemID>([^<]+)<\/ItemID>/)?.[1];
    const title = block.match(/<Title>([^<]*)<\/Title>/)?.[1];
    const price = block.match(/<CurrentPrice[^>]*>([\d.]+)<\/CurrentPrice>/)?.[1];
    const url = block.match(/<ViewItemURL>([^<]+)<\/ViewItemURL>/)?.[1] ?? null;
    if (itemId && title && price) {
      listings.push({
        itemId,
        title: decodeXmlEntities(title),
        priceCents: Math.round(parseFloat(price) * 100),
        url,
      });
    }
  }
  return listings;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export interface EbayPublishResult {
  ok: boolean;
  listingId?: string;
  error?: string;
}

async function ebayJson(
  accessToken: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Content-Language": "en-US",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

function ebayErrorMessage(data: unknown): string {
  const errors = (data as { errors?: { message?: string; longMessage?: string }[] })?.errors;
  return errors?.[0]?.longMessage ?? errors?.[0]?.message ?? "eBay rejected the request";
}

/**
 * Publish an item to eBay via the Inventory API:
 * inventory item -> offer -> publish. Requires the seller account to have
 * business policies (payment/fulfillment/return) configured on eBay.
 */
export async function publishToEbay(
  accessToken: string,
  input: {
    sku: string;
    title: string;
    description: string;
    condition: string; // NEW | USED_EXCELLENT | USED_GOOD | USED_ACCEPTABLE
    quantity: number;
    priceDollars: string;
    categoryId?: string;
  },
): Promise<EbayPublishResult> {
  // 1. Create or replace the inventory item.
  const inv = await ebayJson(accessToken, "PUT", `/sell/inventory/v1/inventory_item/${encodeURIComponent(input.sku)}`, {
    product: { title: input.title.slice(0, 80), description: input.description.slice(0, 4000) },
    condition: input.condition,
    availability: { shipToLocationAvailability: { quantity: input.quantity } },
  });
  if (!inv.ok) return { ok: false, error: ebayErrorMessage(inv.data) };

  // 2. Create the offer.
  const offer = await ebayJson(accessToken, "POST", "/sell/inventory/v1/offer", {
    sku: input.sku,
    marketplaceId: "EBAY_US",
    format: "FIXED_PRICE",
    availableQuantity: input.quantity,
    categoryId: input.categoryId,
    listingDescription: input.description.slice(0, 4000),
    pricingSummary: { price: { currency: "USD", value: input.priceDollars } },
  });
  const offerId = (offer.data as { offerId?: string })?.offerId;
  if (!offer.ok || !offerId) return { ok: false, error: ebayErrorMessage(offer.data) };

  // 3. Publish.
  const pub = await ebayJson(accessToken, "POST", `/sell/inventory/v1/offer/${offerId}/publish`, {});
  const listingId = (pub.data as { listingId?: string })?.listingId;
  if (!pub.ok || !listingId) return { ok: false, error: ebayErrorMessage(pub.data) };

  return { ok: true, listingId };
}
