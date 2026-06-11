import Link from "next/link";
import { IconCheck } from "@/components/icons";
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
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
          <span className="text-emerald-600">Flip</span>Ledger
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          {user ? (
            <Link href="/dashboard" className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Open app</Link>
          ) : (
            <>
              <Link href="/login" className="text-zinc-600 hover:text-zinc-900">Sign in</Link>
              <Link href="/signup" className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Start free</Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Simple pricing. No transaction caps.
        </h1>
        <p className="mt-4 text-zinc-500">
          Competitors charge more as you sell more. FlipLedger doesn&apos;t punish growth.
        </p>
      </section>

      <section className="mx-auto grid max-w-3xl grid-cols-1 gap-6 px-6 pb-20 sm:grid-cols-2">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl border p-6 shadow-sm ${
              tier.highlighted ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-200"
            }`}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{tier.name}</h2>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{tier.price}</p>
            <p className="text-xs text-zinc-400">{tier.cadence}</p>
            <p className="mt-3 text-sm text-zinc-500">{tier.blurb}</p>
            <ul className="mt-5 space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                  <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}
                </li>
              ))}
            </ul>
            <Link
              href={ctaHref}
              className={`mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${
                tier.highlighted
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </section>

      <footer className="border-t border-zinc-100 py-8 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} FlipLedger
      </footer>
    </div>
  );
}
