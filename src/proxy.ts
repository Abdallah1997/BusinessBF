import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic redirect for protected routes. This only checks that a session
 * cookie exists (fast, no DB hit). Real authorization happens in
 * requireUser() on every page and server action.
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inventory/:path*",
    "/listings/:path*",
    "/sales/:path*",
    "/expenses/:path*",
    "/bank/:path*",
    "/connections/:path*",
    "/email-import/:path*",
    "/reports/:path*",
    "/composer/:path*",
    "/settings/:path*",
  ],
};
