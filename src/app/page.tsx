import Link from "next/link";
import {
  IconBank,
  IconBox,
  IconChart,
  IconCheck,
  IconGrid,
  IconSparkle,
  IconTag,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUser } from "@/lib/session";

const checklistColumns = [
  {
    Icon: IconChart,
    label: "Bookkeeping",
    items: ["Profit per sale, after fees", "Yearly P&L statements", "Schedule C tax summary", "CSV export of everything"],
  },
  {
    Icon: IconBox,
    label: "Inventory",
    items: ["Cost of goods on every item", "AI receipt scanning", "Order-email import", "Bulk CSV import"],
  },
  {
    Icon: IconTag,
    label: "Crosslisting",
    items: ["Listings on every marketplace", "Delist alerts on sale", "eBay import & direct publish", "AI listing composer"],
  },
  {
    Icon: IconBank,
    label: "Banking",
    items: ["Plaid bank sync", "AI expense classification", "Confirm-before-book queue", "Mileage deduction log"],
  },
];

function WindowMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40">
      {/* Window chrome */}
      <div className="flex h-10 items-center gap-2 border-b border-zinc-100 bg-zinc-50/50 px-4 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-neutral-700" />
        <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-neutral-700" />
        <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-neutral-700" />
        <div className="ml-auto flex items-center gap-4">
          <div className="h-2 w-20 rounded-full bg-zinc-200 dark:bg-neutral-800" />
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">A</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 bg-white p-6 dark:bg-neutral-900 md:grid-cols-12">
        {/* Sidebar */}
        <div className="hidden space-y-2 md:col-span-3 md:block">
          {[
            { Icon: IconGrid, label: "Dashboard", active: true },
            { Icon: IconBox, label: "Inventory", active: false },
            { Icon: IconTag, label: "Listings", active: false },
            { Icon: IconBank, label: "Bank", active: false },
          ].map(({ Icon, label, active }) => (
            <div
              key={label}
              className={`flex h-8 items-center gap-2 rounded-md px-3 text-sm ${
                active
                  ? "bg-orange-50 font-medium text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                  : "text-zinc-500 dark:text-neutral-400"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="col-span-12 grid grid-cols-2 gap-4 md:col-span-9">
          <div className="rounded-xl border border-zinc-100 p-4 dark:border-neutral-800">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <IconChart className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">+12.5%</span>
            </div>
            <div className="money text-2xl font-semibold tracking-tight text-zinc-900 dark:text-neutral-100">$1,946.12</div>
            <div className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">Profit (this month)</div>
          </div>
          <div className="rounded-xl border border-zinc-100 p-4 dark:border-neutral-800">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                <IconTag className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">1 to delist</span>
            </div>
            <div className="money text-2xl font-semibold tracking-tight text-zinc-900 dark:text-neutral-100">38</div>
            <div className="mt-1 text-xs text-zinc-400 dark:text-neutral-500">Active listings</div>
          </div>

          {/* Chart */}
          <div className="relative col-span-2 flex h-40 flex-col justify-end overflow-hidden rounded-xl border border-zinc-100 p-4 dark:border-neutral-800">
            <div className="absolute left-4 top-4 text-sm font-medium text-zinc-900 dark:text-neutral-100">Profit by month</div>
            <div className="flex h-24 w-full items-end gap-2 px-1">
              {[40, 60, 45, 80, 75, 55, 90].map((h, i) => (
                <div
                  key={i}
                  className={`w-full rounded-t-sm ${i === 6 ? "bg-orange-500" : i >= 3 ? "bg-orange-400/70" : "bg-orange-200 dark:bg-orange-900/60"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = await getUser();
  const appHref = user ? "/dashboard" : "/signup";

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-neutral-950">
      {/* Fixed glass nav */}
      <nav className="glass fixed top-0 z-50 w-full border-b border-zinc-200/50 dark:border-neutral-800/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-lg font-semibold tracking-tighter text-white shadow-lg shadow-orange-500/20">
              B
            </div>
            <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-neutral-100">BusinessBF</span>
          </div>

          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-500 dark:text-neutral-400 md:flex">
            <a href="#features" className="transition-colors hover:text-zinc-900 dark:hover:text-white">Features</a>
            <a href="#everything" className="transition-colors hover:text-zinc-900 dark:hover:text-white">What&apos;s inside</a>
            <Link href="/pricing" className="transition-colors hover:text-zinc-900 dark:hover:text-white">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-zinc-900/10 transition-colors hover:bg-zinc-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                Open app
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white md:block">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-zinc-900/10 transition-colors hover:bg-zinc-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden px-6 pt-32 pb-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(249,115,22,0.14) 0%, rgba(255,255,255,0) 50%)" }}
        />
        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
            The reseller&apos;s operating system
          </div>

          <h1 className="mb-6 text-5xl font-semibold leading-[1.1] tracking-tight text-zinc-900 dark:text-neutral-100 md:text-7xl">
            Run your entire reselling
            <br className="hidden md:block" /> business in <span className="text-orange-600 dark:text-orange-500">one system.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg font-light leading-relaxed text-zinc-500 dark:text-neutral-400 md:text-xl">
            From inventory and crosslisting to bank sync and tax reports. BusinessBF is the unified
            platform for resellers who treat flipping like a business.
          </p>

          <div className="mb-20 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={appHref}
              className="w-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3.5 font-medium text-white shadow-xl shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/30 sm:w-auto"
            >
              {user ? "Go to dashboard" : "Start free"}
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-full border border-zinc-200 bg-white px-8 py-3.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:w-auto"
            >
              See pricing
            </Link>
          </div>

          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 -z-10 translate-y-20 bg-gradient-to-t from-orange-500/10 to-transparent blur-3xl" />
            <WindowMock />
          </div>
        </div>
      </header>

      {/* Bento features */}
      <section id="features" className="bg-white px-6 py-24 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 max-w-3xl">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-neutral-100 md:text-4xl">
              Complete control over your operation.
            </h2>
            <p className="text-lg text-zinc-500 dark:text-neutral-400">
              Stop juggling spreadsheets and disconnected apps. One source of truth for what you own,
              where it&apos;s listed, and what you actually made.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Large: inventory */}
            <div className="group relative col-span-1 overflow-hidden rounded-2xl border border-zinc-100 bg-gray-50 p-8 transition-colors hover:border-orange-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-orange-900 md:col-span-2">
              <div className="relative z-10 max-w-sm">
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-orange-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-orange-400">
                  <IconBox className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-neutral-100">Inventory with real costs</h3>
                <p className="text-sm leading-relaxed text-zinc-500 dark:text-neutral-400">
                  Every item carries what you paid from sourcing to sale. Scan receipts, import order
                  emails, or pull from a bank transaction; profit math stays honest.
                </p>
              </div>
              <div className="absolute bottom-0 right-0 hidden h-4/5 w-1/2 translate-x-4 translate-y-4 rounded-tl-2xl border-l border-t border-zinc-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:block">
                <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-neutral-700">
                  <span className="text-xs font-medium text-zinc-500 dark:text-neutral-400">Item</span>
                  <span className="text-xs font-medium text-zinc-500 dark:text-neutral-400">Cost</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Nike Air Max 90", v: "$12.50" },
                    { name: "Vintage sweater", v: "$8.00" },
                    { name: "Lego 75257", v: "$15.50" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                        <span className="text-xs text-zinc-700 dark:text-neutral-300">{r.name}</span>
                      </div>
                      <span className="money text-xs font-medium text-zinc-900 dark:text-neutral-100">{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tall dark: AI */}
            <div className="relative col-span-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="absolute right-0 top-0 rounded-full bg-orange-500/10 p-32 blur-3xl" />
              <div className="relative z-10">
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-orange-400 shadow-sm">
                  <IconSparkle className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">AI does the tedious parts</h3>
                <p className="mb-8 text-sm leading-relaxed text-zinc-400">
                  Receipts read themselves. Bank transactions sort themselves. Listings write
                  themselves. You approve; nothing books without your confirmation.
                </p>
                <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-400">GOODWILL #123 · $34.50</span>
                    <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-orange-400">inventory · 92%</span>
                  </div>
                  <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-zinc-700">
                    <div className="h-full w-11/12 bg-orange-500" />
                  </div>
                  <button className="w-full rounded-lg bg-white py-2 text-xs font-semibold text-zinc-900">Confirm</button>
                </div>
              </div>
            </div>

            {/* Small cards */}
            {[
              {
                Icon: IconTag,
                title: "Crosslisting",
                body: "Track every listing per item. Sell once anywhere and the rest flag for delisting. eBay connects directly.",
              },
              {
                Icon: IconBank,
                title: "Bank sync",
                body: "Plaid-linked accounts or CSV import. Credentials never touch BusinessBF; tokens are encrypted.",
              },
              {
                Icon: IconChart,
                title: "Tax-ready books",
                body: "Schedule C categories, mileage at the IRS rate, year-end P&L your accountant will accept.",
              },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="col-span-1 rounded-2xl border border-zinc-200 bg-white p-8 transition-all hover:shadow-lg hover:shadow-zinc-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:shadow-black/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-neutral-100">{title}</h3>
                <p className="text-sm text-zinc-500 dark:text-neutral-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checklist columns */}
      <section id="everything" className="border-t border-zinc-200 bg-gray-50 px-6 py-20 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
            {checklistColumns.map(({ Icon, label, items }) => (
              <div key={label} className="space-y-6">
                <div className="flex items-center gap-2 font-medium text-orange-600 dark:text-orange-400">
                  <Icon className="h-4 w-4" /> {label}
                </div>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-zinc-600 dark:text-neutral-400">
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-neutral-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-12 text-center shadow-2xl dark:border dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950 md:p-20">
          <div className="absolute right-0 top-0 rounded-full bg-orange-500/20 p-40 blur-[100px]" />
          <div className="relative z-10">
            <h2 className="mb-6 text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Ready to know your real numbers?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-zinc-400">
              Built by a reseller, for resellers. Start free; your data exports to CSV anytime,
              so there&apos;s nothing to lose.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={appHref}
                className="w-full rounded-full bg-orange-500 px-8 py-3.5 font-medium text-white shadow-lg shadow-orange-500/30 transition-colors hover:bg-orange-600 sm:w-auto"
              >
                {user ? "Open BusinessBF" : "Get started now"}
              </Link>
              <Link
                href="/pricing"
                className="w-full rounded-full border border-zinc-600 bg-transparent px-8 py-3.5 font-medium text-white transition-colors hover:bg-white/5 sm:w-auto"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-8 text-xs text-zinc-500">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900 px-6 py-16 text-zinc-400 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-orange-500 text-xs text-white">B</div>
              <span className="text-lg font-semibold tracking-tight text-white">BusinessBF</span>
            </div>
            <p className="mb-6 max-w-xs text-sm text-zinc-500">
              The all-in-one operating system for resellers. Inventory, crosslisting, banking and
              bookkeeping that always agree.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-medium text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="transition-colors hover:text-orange-400">Inventory</a></li>
              <li><a href="#features" className="transition-colors hover:text-orange-400">Crosslisting</a></li>
              <li><a href="#features" className="transition-colors hover:text-orange-400">Bank sync</a></li>
              <li><Link href="/pricing" className="transition-colors hover:text-orange-400">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-medium text-white">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/signup" className="transition-colors hover:text-orange-400">Create account</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-orange-400">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-16 max-w-7xl border-t border-zinc-800 pt-8 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} BusinessBF. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
