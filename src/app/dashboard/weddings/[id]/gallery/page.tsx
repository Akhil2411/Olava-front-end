import { GalleryManager } from "@/features/gallery/components/GalleryManager";
import { getMedia, getWedding } from "@/features/weddings/data";

export default async function GalleryPage({ params }: PageProps<"/dashboard/weddings/[id]/gallery">) {
  const { id } = await params;
  const [wedding, media] = await Promise.all([getWedding(id), getMedia(id, "Gallery")]);
  return <GalleryManager weddingId={id} media={media} limit={100} readOnly={wedding.status === "Archived"} />;
}
