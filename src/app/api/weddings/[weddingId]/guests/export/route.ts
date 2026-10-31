import { relay, UUID } from "@/lib/api/relay";

/** CSV export of the guest list (private). */
export async function GET(_: Request, ctx: RouteContext<"/api/weddings/[weddingId]/guests/export">) {
  const { weddingId } = await ctx.params;
  if (!UUID.test(weddingId)) return new Response(null, { status: 404 });
  return relay(`/api/v1/weddings/${weddingId}/guests/export`);
}
