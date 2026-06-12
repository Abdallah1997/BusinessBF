import Link from "next/link";
import { IconBank, IconBox, IconChart, IconMail, IconSparkle, IconTag } from "@/components/icons";
import { getUser } from "@/lib/session";

const featureRows = [
  {
    Icon: IconBox,
    title: "Inventory that knows what you paid",
    body: "Every item carries its cost from sourcing to sale. Scan a receipt and AI fills in the store, date and total; your profit numbers stay real.",
  },
  {
    Icon: IconTag,
    title: "One item, every marketplace",
    body: "Track listings across eBay, Poshmark, Mercari, Depop and Facebook. Sell something anywhere and every other live listing gets flagged before a double-sale happens. Connect eBay to import and publish listings directly.",
  },
  {
    Icon: IconBank,
    title: "Your bank, sorted by AI",
    body: "Link a bank through Plaid or import a CSV. AI separates inventory buys from business expenses from personal spending; nothing is booked until you confirm it.",
  },
  {
    Icon: IconMail,
    title: "Order emails become inventory",
    body: "Paste a purchase confirmation and AI extracts the items, quantities and prices. Approve the ones you want; they land in inventory with cost attached.",
  },
  {
    Icon: IconChart,
    title: "Tax season in one click",
    body: "Expenses map to Schedule C lines, mileage uses the IRS standard rate, and the year-end P&L is ready for your accountant.",
  },
  {
    Icon: IconSparkle,
    title: "Listings written for you",
    body: "Pick an item and AI writes the title, description, hashtags and a suggested price, formatted correctly for each marketplace's limits.",
  },
];

function HeroMock() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl shadow-emerald-900/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">This month</p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
          live profit
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">Revenue</p>
          <p className="money mt-1 text-xl font-bold text-zinc-900">$4,182.40</p>
        </div>
        <div className="rounded-xl bg-emerald-600 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-100">Profit</p>
          <p className="money mt-1 text-xl font-bold text-white">$1,946.12</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {[
          { name: "Nike Air Max 90, sz 10", mp: "eBay", profit: "+$22.43" },
          { name: "Vintage wool sweater", mp: "Poshmark", profit: "+$31.08" },
          { name: "Lego Star Wars 75257", mp: "Mercari", profit: "+$18.60" },
        ].map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2">
            <div>
              <p className="text-xs font-medium text-zinc-800">{row.name}</p>
              <p className="text-[10px] text-zinc-400">{row.mp}</p>
            </div>
            <p className="money text-xs font-semibold text-emerald-600">{row.profit}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <p className="text-[11px] text-amber-800">1 listing to delist: sweater sold on Poshmark</p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = await getUser();
  const appHref = user ? "/dashboard" : "/signup";

  return (
    <div className="min-h-dvh bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight text-zinc-900">
          Business<span className="text-emerald-600">BF</span>
        </span>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/pricing" className="text-zinc-600 transition-colors hover:text-zinc-900">Pricing</Link>
          {user ? (
            <Link href="/dashboard" className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700">
              Open app
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-zinc-600 transition-colors hover:text-zinc-900">Sign in</Link>
              <Link href="/signup" className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700">
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-16 pb-20 lg:grid-cols-2">
        <div className="animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            For resellers who flip for real money
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
            Know your profit on every flip.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-500">
            Inventory, crosslisting and bookkeeping in one place, with AI doing the tedious parts:
            reading receipts, sorting bank transactions, writing listings.
          </p>
          <div className="mt-8">
            <Link
              href={appHref}
              className="inline-block rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-emerald-700 active:translate-y-px"
            >
              {user ? "Go to dashboard" : "Start free, no card required"}
            </Link>
          </div>
          <p className="mt-4 text-xs text-zinc-400">
            One tool instead of two subscriptions. Your data exports to CSV anytime.
          </p>
        </div>
        <div className="animate-fade-up lg:pl-6">
          <HeroMock />
        </div>
      </section>

      <section className="border-t border-zinc-100 bg-zinc-50/60 py-20">
        <div className="mx-auto max-w-4xl space-y-10 px-6">
          {featureRows.map(({ Icon, title, body }, i) => (
            <div
              key={title}
              className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6 ${i % 2 === 1 ? "sm:flex-row-reverse sm:text-right" : ""}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700 ${i % 2 === 1 ? "sm:ml-auto" : ""}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="max-w-xl">
                <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-6 py-20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Built by a reseller, for resellers.</h2>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Other tools make you choose between inventory tracking and bookkeeping.
            BusinessBF does both, so your numbers always agree.
          </p>
        </div>
        <Link
          href={appHref}
          className="shrink-0 rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white transition-all hover:bg-emerald-700 active:translate-y-px"
        >
          {user ? "Open BusinessBF" : "Create your free account"}
        </Link>
      </section>

      <footer className="border-t border-zinc-100 py-8 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} BusinessBF · <Link href="/pricing" className="transition-colors hover:text-zinc-600">Pricing</Link>
      </footer>
    </div>
  );
}
