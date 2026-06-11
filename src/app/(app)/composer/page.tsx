import { Composer } from "@/components/composer";
import { PageHeader } from "@/components/ui";
import { isAiConfigured } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Listing composer" };

export default async function ComposerPage() {
  const user = await requireUser();

  const items = await prisma.item.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, sku: true },
  });

  return (
    <>
      <PageHeader
        title="Listing composer"
        subtitle="Pick an item and let AI write the listing — or write once yourself. Either way, every marketplace gets correctly formatted copy."
      />
      <Composer items={items} aiConfigured={isAiConfigured()} />
    </>
  );
}
