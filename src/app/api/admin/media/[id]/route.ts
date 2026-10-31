import { isId } from "@/lib/api/loaders";
import { relay } from "@/lib/api/relay";

/** Small preview of an uploaded image for staff review (the API checks the staff role). */
export async function GET(_request: Request, ctx: RouteContext<"/api/admin/media/[id]">) {
  const { id } = await ctx.params;
  if (!isId(id)) return new Response(null, { status: 404 });
  return relay(`/api/v1/admin/media/${id}/preview`);
}
