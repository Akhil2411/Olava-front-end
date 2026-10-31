import { relay, UUID } from "@/lib/api/relay";

/** Downloadable QR code for the stable /q/{code} URL. The API refuses unless the site is published. */
export async function GET(request: Request, ctx: RouteContext<"/api/weddings/[weddingId]/qr">) {
  const { weddingId } = await ctx.params;
  const format = new URL(request.url).searchParams.get("format") === "svg" ? "svg" : "png";
  if (!UUID.test(weddingId)) return new Response(null, { status: 404 });
  return relay(`/api/v1/weddings/${weddingId}/share/qr?format=${format}`, {
    disposition: `attachment; filename="wedding-qr-code.${format}"`,
  });
}
