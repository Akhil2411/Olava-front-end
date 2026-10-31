import { DangerZone } from "@/features/weddings/components/DangerZone";
import { getWedding } from "@/features/weddings/data";

export default async function SettingsPage({ params }: PageProps<"/dashboard/weddings/[id]/settings">) {
  const { id } = await params;
  return <DangerZone wedding={await getWedding(id)} />;
}
