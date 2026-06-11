"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/inventory", label: "Inventory", icon: "▤" },
  { href: "/listings", label: "Listings", icon: "◫" },
  { href: "/sales", label: "Sales", icon: "▲" },
  { href: "/expenses", label: "Expenses", icon: "▽" },
  { href: "/reports", label: "Reports", icon: "≣" },
  { href: "/composer", label: "Composer", icon: "✎" },
  { href: "/settings", label: "Settings", icon: "⚙" },
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
          className="text-xs font-medium text-zinc-400 hover:text-white transition-colors md:hidden"
        >
          Sign out
        </button>
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-0.5 md:pb-0">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-emerald-600/15 text-emerald-300" : "hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <span aria-hidden className="hidden text-xs opacity-70 md:inline">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden border-t border-zinc-800 px-5 py-4 md:block">
        <p className="truncate text-xs text-zinc-500" title={email}>{email}</p>
        <button
          onClick={handleSignOut}
          className="mt-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
