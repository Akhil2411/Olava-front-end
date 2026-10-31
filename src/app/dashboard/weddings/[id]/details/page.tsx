import { headers } from "next/headers";
import { Card, CardHeader } from "@/components/ui";
import { DetailsForm } from "@/features/weddings/components/DetailsForm";
import { getWedding } from "@/features/weddings/data";

export default async function DetailsPage({ params }: PageProps<"/dashboard/weddings/[id]/details">) {
  const { id } = await params;
  const wedding = await getWedding(id);
  const h = await headers();
  const publicBase = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  return (
    <Card className="max-w-3xl">
      <CardHeader title="Wedding details" description="Entered once and used across your whole website." />
      <DetailsForm wedding={wedding} publicBase={publicBase} />
    </Card>
  );
}
