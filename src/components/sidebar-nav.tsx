"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  IconBank,
  IconBox,
  IconChart,
  IconGear,
  IconGrid,
  IconMail,
  IconPen,
  IconReceipt,
  IconTag,
  IconTrendUp,
} from "./icons";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: IconGrid },
  { href: "/inventory", label: "Inventory", Icon: IconBox },
  { href: "/listings", label: "Listings", Icon: IconTag },
  { href: "/sales", label: "Sales", Icon: IconTrendUp },
  { href: "/expenses", label: "Expenses", Icon: IconReceipt },
  { href: "/bank", label: "Bank", Icon: IconBank },
  { href: "/email-import", label: "Email import", Icon: IconMail },
  { href: "/reports", label: "Reports", Icon: IconChart },
  { href: "/composer", label: "Composer", Icon: IconPen },
  { href: "/settings", label: "Settings", Icon: IconGear },
];

export function SidebarNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-zinc-800 bg-zinc-950 text-zinc-300 md:min-h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-5 py-4 md:py-5">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-white">
          <span className="text-emerald-400">Flip</span>Ledger
        </Link>
        <button
          onClick={handleSignOut}
          className="text-xs font-medium text-zinc-400 transition-colors hover:text-white md:hidden"
        >
          Sign out
        </button>
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-0.5 md:pb-0">
        {links.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-emerald-600/15 text-emerald-300" : "hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon className="hidden h-4 w-4 opacity-70 md:block" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden border-t border-zinc-800 px-5 py-4 md:block">
        <p className="truncate text-xs text-zinc-500" title={email}>{email}</p>
        <button
          onClick={handleSignOut}
          className="mt-2 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
