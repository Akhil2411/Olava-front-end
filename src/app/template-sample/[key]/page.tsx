import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTemplate } from "@/features/catalog/data";
import { SiteRenderer } from "@/templates/SiteRenderer";
import { sampleSite } from "@/templates/sample";

export const metadata: Metadata = { robots: { index: false } };

/** Sample-data render of a template, shown inside the gallery's device preview iframe and the home page showcase. */
export default async function TemplateSamplePage({ params, searchParams }: PageProps<"/template-sample/[key]">) {
  const { key } = await params;
  const { showcase } = await searchParams;
  const template = await getTemplate(key);
  if (!template) notFound();
  const site = sampleSite(template);
  // ?showcase=1: the home page's device mockups. Opened (no opening animation; see isShowcase) and silent.
  return <SiteRenderer site={showcase ? { ...site, music: null } : site} mode="sample" imageUrl={() => null} />;
}
