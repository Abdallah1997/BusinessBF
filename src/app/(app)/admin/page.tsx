import { Card, EmptyState, PageHeader, StatusBadge, tdCls, thCls } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Admin" };

const PROVIDER_LABEL: Record<string, string> = {
  credential: "Email/password",
  google: "Google",
  discord: "Discord",
};

function fmt(d: Date): string {
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminPage() {
  await requireAdmin();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [userCount, newThisWeek, users, sessions] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { accounts: { select: { providerId: true } } },
    }),
    prisma.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { email: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Admin" subtitle="Who has signed up and recent logins. Visible only to you." />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-5 animate-fade-up">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-neutral-500">Total users</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-neutral-100">{userCount}</p>
        </Card>
        <Card className="p-5 animate-fade-up">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-neutral-500">New (7 days)</p>
          <p className="mt-1 text-3xl font-bold text-orange-600 dark:text-orange-400">{newThisWeek}</p>
        </Card>
        <Card className="p-5 animate-fade-up">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-neutral-500">Recent logins shown</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-neutral-100">{sessions.length}</p>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-neutral-100">Signups</h2>
      {users.length === 0 ? (
        <EmptyState title="No users yet" hint="Signups appear here as people create accounts." />
      ) : (
        <Card className="mb-8 overflow-x-auto animate-fade-up">
          <table className="w-full">
            <thead className="border-b border-zinc-200 dark:border-neutral-800">
              <tr>
                <th className={thCls}>Email</th>
                <th className={thCls}>Name</th>
                <th className={thCls}>Joined</th>
                <th className={thCls}>Method</th>
                <th className={thCls}>Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-neutral-800">
              {users.map((u) => {
                const methods = [...new Set(u.accounts.map((a) => PROVIDER_LABEL[a.providerId] ?? a.providerId))];
                return (
                  <tr key={u.id}>
                    <td className={`${tdCls} font-medium text-zinc-900 dark:text-neutral-100`}>{u.email}</td>
                    <td className={tdCls}>{u.name}</td>
                    <td className={`${tdCls} whitespace-nowrap`}>{fmt(u.createdAt)}</td>
                    <td className={tdCls}>{methods.join(", ") || "—"}</td>
                    <td className={tdCls}>
                      <StatusBadge status={u.emailVerified ? "ACTIVE" : "DRAFT"} label={u.emailVerified ? "verified" : "unverified"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-neutral-100">Recent logins</h2>
      {sessions.length === 0 ? (
        <EmptyState title="No logins yet" hint="Each login creates a session and shows up here." />
      ) : (
        <Card className="overflow-x-auto animate-fade-up">
          <table className="w-full">
            <thead className="border-b border-zinc-200 dark:border-neutral-800">
              <tr>
                <th className={thCls}>Email</th>
                <th className={thCls}>When</th>
                <th className={thCls}>IP</th>
                <th className={thCls}>Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-neutral-800">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className={`${tdCls} font-medium text-zinc-900 dark:text-neutral-100`}>{s.user.email}</td>
                  <td className={`${tdCls} whitespace-nowrap`}>{fmt(s.createdAt)}</td>
                  <td className={tdCls}>{s.ipAddress || "—"}</td>
                  <td className={`${tdCls} max-w-xs truncate`} title={s.userAgent ?? undefined}>{s.userAgent || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
