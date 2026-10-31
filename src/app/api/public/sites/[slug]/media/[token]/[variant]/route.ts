import { relay, SLUG, TOKEN, VARIANTS } from "@/lib/api/relay";

/** Public image of a PUBLISHED site. Stops working as soon as the site is unpublished or the image deleted. */
export async function GET(request: Request, ctx: RouteContext<"/api/public/sites/[slug]/media/[token]/[variant]">) {
  const { slug, token, variant } = await ctx.params;
  if (!SLUG.test(slug) || !TOKEN.test(token) || !VARIANTS.has(variant)) return new Response(null, { status: 404 });
  return relay(`/api/v1/public/sites/${slug}/media/${token}/${variant}`, { auth: false, range: request.headers.get("range") });
}
