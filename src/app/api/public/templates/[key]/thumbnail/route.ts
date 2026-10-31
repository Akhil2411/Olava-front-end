import { relay } from "@/lib/api/relay";

const KEY = /^[a-z0-9-]{2,80}$/;

/** A template's uploaded thumbnail (Admin → Templates). Public, like the catalogue. */
export async function GET(_request: Request, ctx: RouteContext<"/api/public/templates/[key]/thumbnail">) {
  const { key } = await ctx.params;
  if (!KEY.test(key)) return new Response(null, { status: 404 });
  return relay(`/api/v1/templates/${key}/thumbnail`, { auth: false });
}
