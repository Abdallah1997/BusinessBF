import { NextResponse } from "next/server";

type Bucket = { count: number; reset: number };

// Per-instance fixed-window counters. On serverless this is per lambda, not a
// shared global cap, so it's a guardrail against bursts/abuse from one client,
// not a precise global quota. For strict global limits use a shared store
// (e.g. Upstash Redis / Vercel KV). better-auth already rate-limits /api/auth.
const buckets = new Map<string, Bucket>();

function clientIp(req: Request): string {
  const h = req.headers;
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Returns a 429 response if the caller (by IP) has exceeded `max` requests in
 * `windowMs` for the named bucket, otherwise null (caller proceeds).
 */
export function rateLimited(
  req: Request,
  name: string,
  max: number,
  windowMs: number,
): NextResponse | null {
  const now = Date.now();
  const key = `${name}:${clientIp(req)}`;
  const b = buckets.get(key);

  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
  } else if (b.count >= max) {
    const retryAfter = Math.ceil((b.reset - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Slow down and try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  } else {
    b.count += 1;
  }

  // Bound memory: occasionally drop expired buckets.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }
  return null;
}
