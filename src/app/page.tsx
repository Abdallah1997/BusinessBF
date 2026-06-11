import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { getUser } from "@/lib/session";

const features = [
  {
    title: "Inventory with real COGS",
    body: "Every item carries its cost from sourcing to sale, so profit numbers are real — not guesses.",
  },
  {
    title: "One item, every marketplace",
    body: "Track listings across eBay, Poshmark, Mercari, Depop, Facebook and more. When something sells, FlipLedger flags every other live listing so you never double-sell.",
  },
  {
    title: "Profit on every sale",
    body: "Fees, shipping labels, packaging and cost of goods deducted automatically. See true profit and margin per order.",
  },
  {
    title: "Tax-ready in one click",
    body: "Expenses map to Schedule C lines. Mileage at the IRS standard rate. Year-end P&L your accountant will love.",
  },
  {
    title: "Listing composer",
    body: "Write a listing once and get correctly formatted copy for each marketplace — title limits, hashtags and platform tone handled.",
  },
  {
    title: "Your data, always",
    body: "Full CSV export of sales, expenses and inventory anytime. No lock-in.",
  },
];

export default async function HomePage() {
  const user = await getUser();
  const appHref = user ? "/dashboard" : "/signup";

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight text-zinc-900">
          <span className="text-emerald-600">Flip</span>Ledger
        </span>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</Link>
          {user ? (
            <Link href="/dashboard" className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
              Open app
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-zinc-600 hover:text-zinc-900">Sign in</Link>
              <Link href="/signup" className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
          Stop juggling spreadsheets.
          <br />
          <span className="text-emerald-600">Know your profit on every flip.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-500">{BRAND.description}</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href={appHref} className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700">
            {user ? "Go to dashboard" : "Start free — no card required"}
          </Link>
          <Link href="/pricing" className="text-base font-medium text-zinc-600 hover:text-zinc-900">
            See pricing →
          </Link>
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          Inventory + crosslisting tracker + bookkeeping. One tool instead of two subscriptions.
        </p>
      </section>

      <section className="border-t border-zinc-100 bg-zinc-50/60 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 text-center">
        <h2 className="text-2xl font-bold text-zinc-900">Built by a reseller, for resellers.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">
          Other tools make you choose: inventory tracking <em>or</em> bookkeeping. FlipLedger does both, so your numbers always agree.
        </p>
        <Link href={appHref} className="mt-6 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-700">
          {user ? "Open FlipLedger" : "Create your free account"}
        </Link>
      </section>

      <footer className="border-t border-zinc-100 py-8 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} FlipLedger · <Link href="/pricing" className="hover:text-zinc-600">Pricing</Link>
      </footer>
    </div>
  );
}
