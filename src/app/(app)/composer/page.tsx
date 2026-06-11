import { Composer } from "@/components/composer";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Listing composer" };

export default async function ComposerPage() {
  await requireUser();

  return (
    <>
      <PageHeader
        title="Listing composer"
        subtitle="Write your listing once — get correctly formatted copy for every marketplace, with title limits enforced."
      />
      <Composer />
    </>
  );
}
