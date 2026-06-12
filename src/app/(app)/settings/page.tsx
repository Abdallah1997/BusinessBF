import { ActionForm } from "@/components/action-form";
import { Card, PageHeader, inputCls, labelCls } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { importInventoryCsv } from "@/server/import";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Settings" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-neutral-400">Name</dt>
              <dd className="text-zinc-900 dark:text-neutral-100">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-neutral-400">Email</dt>
              <dd className="text-zinc-900 dark:text-neutral-100">{user.email}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-neutral-100">Import inventory from CSV</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-neutral-400">
            Header row required. Columns: <code className="rounded bg-zinc-100 dark:bg-neutral-800 px-1">name, cost, quantity</code>{" "}
            plus optional <code className="rounded bg-zinc-100 dark:bg-neutral-800 px-1">sku, brand, category, size, condition, purchased_at, source, notes</code>.
            Coming from another tool? Export there, rename headers, import here.
          </p>
          <div className="mt-4">
            <ActionForm action={importInventoryCsv} submitLabel="Import CSV">
              <div>
                <label className={labelCls}>CSV file (max 1 MB)</label>
                <input name="file" type="file" accept=".csv,text/csv" required className={inputCls} />
              </div>
            </ActionForm>
          </div>
        </Card>
      </div>
    </>
  );
}
