import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { ItemFields } from "@/components/item-fields";
import { Card, PageHeader, btnGhost } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { updateItem } from "@/server/items";

export const metadata = { title: "Edit item" };

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const item = await prisma.item.findFirst({ where: { id, userId: user.id } });
  if (!item) notFound();

  return (
    <>
      <PageHeader
        title="Edit item"
        subtitle={item.name}
        action={<Link href="/inventory" className={btnGhost}>Back to inventory</Link>}
      />
      <Card className="p-5 animate-fade-up">
        <ActionForm action={updateItem} submitLabel="Save changes">
          <input type="hidden" name="id" value={item.id} />
          <ItemFields defaults={item} showStatus />
        </ActionForm>
      </Card>
    </>
  );
}
