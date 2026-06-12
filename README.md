# BusinessBF

Inventory, crosslisting and bookkeeping for resellers — in one place.

One tool instead of two: tracks what SellerLedger tracks (profit, expenses, Schedule C tax reports) **and** what TrackNList tracks (inventory, multi-marketplace listings, delist alerts), with the two halves sharing one source of truth.

## Features

- **Inventory** — items with cost of goods, condition, sourcing info, quantity; CSV import/export
- **Listings** — track each item across eBay, Poshmark, Mercari, Depop, Facebook, Etsy, Whatnot, Grailed, Vinted; when an item sells anywhere, every other live listing is flagged for delisting
- **Sales** — record a sale and the matching listing is auto-marked SOLD; profit = gross − fees − shipping − packaging − COGS, computed per order
- **Expenses & mileage** — categories aligned to IRS Schedule C lines; standard mileage rate deduction
- **Reports** — yearly P&L, Schedule C summary, CSV exports
- **Listing composer** — write a listing once, get correctly formatted copy per marketplace with title limits enforced

## AI features (require `ANTHROPIC_API_KEY` in `.env`)

Powered by the Claude API; every feature degrades gracefully to a setup hint when no key is set.

- **Receipt scan** (Inventory) — photograph a receipt, Claude vision extracts store/date/items/total and pre-fills the item form for review
- **Bank transaction classification** (Bank) — import a bank CSV; AI tags each spend as business expense (with Schedule C category), inventory purchase, or personal. Nothing is booked until you confirm each row
- **Email import** (Email import) — paste or upload an order-confirmation email; AI extracts the purchased items, you approve which become inventory
- **AI listing writer** (Composer) — pick an inventory item, AI writes the title/description/hashtags and suggests a price; per-marketplace formatting applies automatically
- **Business insights** (Dashboard) — AI analyzes your real sales, fees, expenses and stale listings into actionable next steps

Bank accounts store nickname/institution/last-4 only, never account numbers, routing numbers or logins. Automatic inbox sync (Gmail OAuth) is a roadmap item; CSV/paste flows ship now.

## Integrations (optional, each gated on env keys)

- **Plaid bank sync** — set `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (free sandbox keys at dashboard.plaid.com) plus `ENCRYPTION_KEY` (`openssl rand -base64 32`). A "Connect a bank with Plaid" button appears on the Bank page; transactions sync into the AI review queue. Access tokens are AES-256-GCM encrypted at rest; bank credentials never touch this app.
- **eBay two-way sync** — create an app at developer.ebay.com, point its redirect at `/api/ebay/callback`, set `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_RU_NAME`, `EBAY_ENV`. Then connect on the Connections page: import active listings, and publish inventory items to eBay directly (seller account needs business policies configured on eBay once).
- **Poshmark / Mercari** — no public seller APIs exist; auto-posting requires a browser extension (roadmap). The Connections page explains this and routes users through the AI Composer copy flow.

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 7 · better-auth · Tailwind CSS 4 · zod · Vitest · Claude API (`@anthropic-ai/sdk`)

Design language lives in [DESIGN.md](DESIGN.md) — motion system, palette, typography and banned patterns.

## Getting started

```bash
npm install
cp .env.example .env       # then fill in BETTER_AUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev
npm run dev
```

## Security model

- Sessions: better-auth, scrypt-hashed passwords, httpOnly cookies, rate-limited auth endpoints
- Authorization: every page and server action calls `requireUser()`; every query is scoped by `userId` (updates/deletes use `updateMany`/`deleteMany` with `{ id, userId }` so ownership is enforced in the same statement)
- The route proxy (`src/proxy.ts`) is an optimistic redirect only — never the security boundary
- All inputs validated with zod; money handled as integer cents end-to-end
- Security headers (CSP, X-Frame-Options DENY, nosniff, referrer policy) in `next.config.ts`
- Login `?next=` redirect restricted to same-origin relative paths
- CSV import capped at 1 MB / 2000 rows; exports require a session

## Testing

```bash
npm test        # unit tests: profit math, money parsing, CSV round-trip
npm run lint
npx tsc --noEmit
```

## Production deployment

1. Switch the database to PostgreSQL:
   - `prisma/schema.prisma`: `provider = "postgresql"`
   - `src/lib/prisma.ts`: swap `@prisma/adapter-better-sqlite3` for `@prisma/adapter-pg`
   - Set `DATABASE_URL` to your Postgres connection string, re-run `npx prisma migrate dev`
2. Set `BETTER_AUTH_SECRET` (new random value) and `BETTER_AUTH_URL` (your domain) in the host's env settings
3. Deploy to Vercel (or any Node host): `npm run build` / `npm start`

### Known npm audit notes

Two moderate advisories are present in **build tooling only** (Prisma's dev CLI server, postcss bundled inside Next.js). Neither ships in the application runtime; `npm audit fix --force` would downgrade Next/Prisma majors and must not be run. Re-check after framework updates.
