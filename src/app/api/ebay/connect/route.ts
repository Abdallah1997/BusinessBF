import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { buildEbayAuthUrl, isEbayConfigured } from "@/lib/ebay";
import { rateLimited } from "@/lib/rate-limit";
import { getUser } from "@/lib/session";

/** Starts the eBay OAuth flow with a CSRF state cookie. */
export async function GET(request: Request) {
  const limited = rateLimited(request, "ebay-connect", 20, 60_000);
  if (limited) return limited;

  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.BETTER_AUTH_URL!));
  if (!isEbayConfigured()) {
    return NextResponse.redirect(new URL("/connections?error=ebay-not-configured", process.env.BETTER_AUTH_URL!));
  }

  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(buildEbayAuthUrl(state));
  response.cookies.set("ebay_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/api/ebay",
  });
  return response;
}
