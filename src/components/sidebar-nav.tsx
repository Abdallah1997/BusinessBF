"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "./theme-toggle";
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
  IconExternal,
} from "./icons";

const groups: { label: string; links: { href: string; label: string; Icon: typeof IconGrid }[] }[] = [
  {
    label: "Operate",
    links: [
      { href: "/dashboard", label: "Dashboard", Icon: IconGrid },
      { href: "/inventory", label: "Inventory", Icon: IconBox },
      { href: "/listings", label: "Listings", Icon: IconTag },
      { href: "/sales", label: "Sales", Icon: IconTrendUp },
    ],
  },
  {
    label: "Money",
    links: [
      { href: "/expenses", label: "Expenses", Icon: IconReceipt },
      { href: "/bank", label: "Bank", Icon: IconBank },
      { href: "/reports", label: "Reports", Icon: IconChart },
    ],
  },
  {
    label: "Tools",
    links: [
      { href: "/composer", label: "Composer", Icon: IconPen },
      { href: "/email-import", label: "Email import", Icon: IconMail },
      { href: "/connections", label: "Connections", Icon: IconExternal },
      { href: "/settings", label: "Settings", Icon: IconGear },
    ],
  },
];

export function SidebarNav({ email, isAdmin = false }: { email: string; isAdmin?: boolean }) {
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
          Business<span className="text-orange-400">BF</span>
        </Link>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle className="!border-zinc-700 !text-zinc-400 hover:!text-white" />
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-0 md:pb-0">
        {groups.map((group, gi) => (
          <div key={group.label} className={`flex flex-row gap-1 md:block ${gi > 0 ? "md:mt-5" : ""}`}>
            <p className="hidden px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-neutral-400 md:block">
              {group.label}
            </p>
            {group.links.map(({ href, label, Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:mb-0.5 ${
                    active ? "bg-orange-600/15 text-orange-300" : "hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <Icon className="hidden h-4 w-4 opacity-70 md:block" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
        {isAdmin && (
          <div className="flex flex-row gap-1 md:mt-5 md:block">
            <p className="hidden px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-neutral-400 md:block">
              Owner
            </p>
            <Link
              href="/admin"
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:mb-0.5 ${
                pathname.startsWith("/admin") ? "bg-orange-600/15 text-orange-300" : "hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <IconChart className="hidden h-4 w-4 opacity-70 md:block" />
              Admin
            </Link>
          </div>
        )}
      </nav>
      <div className="hidden border-t border-zinc-800 px-5 py-4 md:block">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-zinc-500" title={email}>{email}</p>
          <ThemeToggle className="!border-zinc-700 !text-zinc-400 hover:!text-white shrink-0" />
        </div>
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
