import { relay, UUID, VARIANTS } from "@/lib/api/relay";

/** Private draft image for the editor and preview. Requires the session; the API checks ownership. */
export async function GET(request: Request, ctx: RouteContext<"/api/media/[weddingId]/[mediaId]/[variant]">) {
  const { weddingId, mediaId, variant } = await ctx.params;
  if (!UUID.test(weddingId) || !UUID.test(mediaId.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5")) || !VARIANTS.has(variant)) {
    return new Response(null, { status: 404 });
  }
  return relay(`/api/v1/weddings/${weddingId}/media/${mediaId}/content/${variant}`, { range: request.headers.get("range") });
}
