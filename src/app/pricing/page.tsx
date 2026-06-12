import Link from "next/link";
import { IconCheck } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { getUser } from "@/lib/session";

export const metadata = { title: "Pricing" };

const tiers = [
  {
    name: "Starter",
    price: "Free",
    cadence: "while in beta",
    blurb: "Everything you need to run a part-time reselling business.",
    features: [
      "Unlimited inventory items",
      "Listings across all marketplaces",
      "Profit tracking on every sale",
      "Expense & mileage log",
      "CSV import & export",
    ],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12/mo",
    cadence: "coming soon",
    blurb: "For full-time resellers who want every minute back.",
    features: [
      "Everything in Starter",
      "Schedule C tax reports",
      "Listing composer",
      "Delist alerts",
      "Priority support",
    ],
    cta: "Start free",
    highlighted: true,
  },
];

export default async function PricingPage() {
  const user = await getUser();
  const ctaHref = user ? "/dashboard" : "/signup";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-lg font-semibold tracking-tighter text-white shadow-lg shadow-orange-500/20">
            B
          </span>
          <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-neutral-100">BusinessBF</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard" className="rounded-full bg-zinc-900 px-4 py-2 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">Open app</Link>
          ) : (
            <>
              <Link href="/login" className="text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-neutral-100">Sign in</Link>
              <Link href="/signup" className="rounded-full bg-zinc-900 px-4 py-2 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">Start free</Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-neutral-100 sm:text-4xl">
          Simple pricing. No transaction caps.
        </h1>
        <p className="mt-4 text-zinc-500 dark:text-neutral-400">
          Competitors charge more as you sell more. BusinessBF doesn&apos;t punish growth.
        </p>
      </section>

      <section className="mx-auto grid max-w-3xl grid-cols-1 gap-6 px-6 pb-20 sm:grid-cols-2">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border p-6 shadow-sm ${
              tier.highlighted ? "border-orange-500 ring-2 ring-orange-500/20" : "border-zinc-200 dark:border-neutral-800"
            }`}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-neutral-400">{tier.name}</h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-neutral-100">{tier.price}</p>
            <p className="text-xs text-zinc-400 dark:text-neutral-500">{tier.cadence}</p>
            <p className="mt-3 text-sm text-zinc-500 dark:text-neutral-400">{tier.blurb}</p>
            <ul className="mt-5 space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-neutral-300">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" /> {f}
                </li>
              ))}
            </ul>
            <Link
              href={ctaHref}
              className={`mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
                tier.highlighted
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "border border-zinc-300 dark:border-neutral-700 text-zinc-700 dark:text-neutral-300 hover:bg-zinc-50 dark:hover:bg-neutral-800"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </section>

      <footer className="border-t border-zinc-100 dark:border-neutral-800 py-8 text-center text-xs text-zinc-400 dark:text-neutral-500">
        © {new Date().getFullYear()} BusinessBF
      </footer>
    </div>
  );
}
