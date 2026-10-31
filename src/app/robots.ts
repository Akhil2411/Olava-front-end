import type { MetadataRoute } from "next";

/** Marketing pages are indexable; private and per-wedding routes are not. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/preview", "/api", "/w/", "/q/", "/template-sample"] }] };
}
