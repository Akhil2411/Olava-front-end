import { Alert, LinkButton } from "@/components/ui";
import { DevicePreview } from "@/features/preview/DevicePreview";
import { PreviewActions } from "@/features/preview/PreviewActions";
import { getWedding } from "@/features/weddings/data";

export default async function PreviewPage({ params }: PageProps<"/dashboard/weddings/[id]/preview">) {
  const { id } = await params;
  const wedding = await getWedding(id);
  if (!wedding.template) {
    return <Alert tone="info" action={<LinkButton href={`/dashboard/weddings/${id}/design`} size="sm">Choose a design</LinkButton>}>Choose a design to preview your website.</Alert>;
  }
  return (
    <div>
      <Alert tone="info" className="mb-4">
        This is your private draft: only you can see it. {wedding.status === "Published" ? "Guests see the last version you published." : "Publish when you're happy with it."}
      </Alert>
      <PreviewActions weddingId={id} className="mb-4" />
      <DevicePreview src={`/preview/${id}`} />
    </div>
  );
}
