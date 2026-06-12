import { ActionForm } from "@/components/action-form";
import { EmailImportForm } from "@/components/email-import-form";
import { Card, PageHeader, inputCls, labelCls } from "@/components/ui";
import { isAiConfigured } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { saveImportEmail } from "@/server/email-import";

export const metadata = { title: "Email import" };

export default async function EmailImportPage() {
  const user = await requireUser();
  const aiOn = isAiConfigured();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { importEmailAddress: true },
  });

  return (
    <>
      <PageHeader
        title="Email import"
        subtitle="Turn purchase-confirmation emails into inventory: AI reads the order, you approve the items."
      />

      {!aiOn && (
        <Card className="mb-6 border-amber-200 bg-amber-50/60 p-4 animate-fade-up">
          <p className="text-sm text-amber-800">
            Add <code className="rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code> to{" "}
            <code className="rounded bg-amber-100 px-1">.env</code> and restart to enable email extraction.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3 animate-fade-up">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Import an order email</h2>
          <EmailImportForm />
        </Card>

        <Card className="p-5 lg:col-span-2 animate-fade-up">
          <h2 className="text-sm font-semibold text-zinc-900">Your purchase email</h2>
          <p className="mt-1 text-xs text-zinc-400">
            The address your order confirmations arrive at. Automatic inbox sync (Gmail/Outlook OAuth) is on the
            roadmap: for now, forward or paste emails on the left.
          </p>
          <div className="mt-4">
            <ActionForm action={saveImportEmail} submitLabel="Save">
              <div>
                <label className={labelCls}>Email address</label>
                <input
                  name="importEmail"
                  type="email"
                  maxLength={254}
                  defaultValue={dbUser?.importEmailAddress ?? ""}
                  className={inputCls}
                  placeholder="orders@yourbusiness.com"
                />
              </div>
            </ActionForm>
          </div>
        </Card>
      </div>
    </>
  );
}
