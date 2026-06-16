import { SidebarNav } from "@/components/sidebar-nav";
import { isAdminEmail, requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SidebarNav email={user.email} isAdmin={isAdminEmail(user.email)} />
      <main className="flex-1 overflow-x-auto bg-zinc-50 dark:bg-neutral-950 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
