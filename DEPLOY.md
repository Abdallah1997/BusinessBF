# Deploying BusinessBF to Vercel

The app runs on **SQLite** locally. Vercel's filesystem is ephemeral, so production
**must** use Postgres. This guide covers the full path.

## 1. Push to GitHub

Already done if you're reading this in the repo. To re-push:

```bash
git push businessbf HEAD:main
```

`.env` and `dev.db` are gitignored and never leave your machine. Only `.env.example`
(empty placeholders) is committed.

## 2. Switch the database to Postgres (required for Vercel)

This is a small, contained change. Do it once you have a Postgres connection string
(step 3 gives you one). The diff:

1. Install the Postgres driver adapter:
   ```bash
   npm install pg @prisma/adapter-pg
   npm uninstall @prisma/adapter-better-sqlite3
   ```
2. `prisma/schema.prisma` → `datasource db { provider = "postgresql" }`
3. `src/lib/prisma.ts` → use `PrismaPg` from `@prisma/adapter-pg`:
   ```ts
   import { PrismaPg } from "@prisma/adapter-pg";
   const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
   ```
4. `src/lib/auth.ts` → `prismaAdapter(prisma, { provider: "postgresql" })`
5. Delete `prisma/migrations` (SQLite-dialect) and let Vercel sync the schema:
   add to `package.json` scripts → `"vercel-build": "prisma generate && prisma db push && next build"`

Tell Claude "do the Postgres switch" once you have the DB URL and it will apply +
verify all of the above.

## 3. Create the Vercel project

1. vercel.com → Add New → Project → import the **BusinessBF** GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings default
   (the `vercel-build` script handles Prisma).
3. Before the first deploy, add a database: project → **Storage** → create a
   **Postgres** (Neon is the free option). Vercel auto-injects `DATABASE_URL`.

## 4. Environment variables (Project → Settings → Environment Variables)

Copy every value from your local `.env` EXCEPT `DATABASE_URL` (Vercel sets that):

| Variable | Notes |
|---|---|
| `BETTER_AUTH_SECRET` | generate a NEW one: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | your Vercel URL, e.g. `https://businessbf.vercel.app` |
| `ENCRYPTION_KEY` | reuse local, or new `openssl rand -base64 32` (re-linking required if changed) |
| `ANTHROPIC_API_KEY` | from console.anthropic.com |
| `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` | sandbox for now |
| `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_RU_NAME`, `EBAY_ENV` | sandbox for now |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | |

## 5. Update OAuth redirect URIs to the production domain

Once you know the Vercel domain (e.g. `https://businessbf.vercel.app`):

- **Google** Cloud Console → Authorized redirect URI:
  `https://businessbf.vercel.app/api/auth/callback/google`
- **Discord** Developer Portal → OAuth2 → Redirects:
  `https://businessbf.vercel.app/api/auth/callback/discord`
- **eBay** RuName → "Your auth accepted URL":
  `https://businessbf.vercel.app/api/ebay/callback`
  (eBay now accepts this because it's HTTPS — no ngrok needed in production.)
- **Plaid** needs no redirect config (uses Link, not redirect OAuth).

Keep the `localhost` URIs too so local dev keeps working.

## 6. Deploy

Push to `main` (or click Redeploy). Vercel runs `vercel-build`, which syncs the
Postgres schema and builds. Visit the domain, sign up, and you're live.

## Notes

- The first deploy creates an empty Postgres database — your local SQLite test data
  (sandbox banks, test users) does not carry over. That's expected.
- For real banks / live eBay, switch `PLAID_ENV` and `EBAY_ENV` to production and
  add production keysets; no code changes needed.
- Rotate any secret that was shared in plaintext before a public launch.
