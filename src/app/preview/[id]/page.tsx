import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { assertId } from "@/lib/api/loaders";
import { getTemplate } from "@/features/catalog/data";
import { getPreview, getWedding } from "@/features/weddings/data";
import { sampleSite } from "@/templates/sample";
import { withTemplate } from "@/templates/draft";
import { PreviewBarLinks } from "@/features/preview/PreviewActions";
import { SiteRenderer } from "@/templates/SiteRenderer";

// Private draft preview: owner only (proxy requires a session, the API checks ownership), never indexed.
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

const TEMPLATE_KEY = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/** `?template=<key>`: the saved draft shown in another template (the picker's "Live preview"); nothing is saved. */
export default async function DraftPreviewPage({ params, searchParams }: PageProps<"/preview/[id]">) {
  const { id } = await params;
  const { template: key } = await searchParams;
  assertId(id);
  const tryKey = typeof key === "string" && TEMPLATE_KEY.test(key) ? key : null;
  const [result, template] = await Promise.all([getPreview(id), tryKey ? getTemplate(tryKey) : null]);
  if (!result.ok && result.problem.code === "wedding.no_template" && template) {
    // No design chosen yet (the walkthrough's design step, or "Decide later"): the couple's names and date in
    // this template, with sample content for everything else.
    const wedding = await getWedding(id);
    const sample = sampleSite(template);
    const site = { ...sample, couple: { ...sample.couple, title: wedding.title, partnerOneName: wedding.partnerOneName, partnerTwoName: wedding.partnerTwoName,
      weddingDate: wedding.weddingDate ?? sample.couple.weddingDate, timeZoneId: wedding.timeZoneId } };
    return (
      <>
        <div className="sticky top-0 z-10 bg-ink px-4 py-1.5 text-center text-xs font-semibold text-white">Private preview in {template.name}: your names, sample details</div>
        <SiteRenderer site={site} mode="sample" imageUrl={() => null} />
      </>
    );
  }
  if (!result.ok) {
    if (result.problem.status === 401) redirect(`/login?next=/preview/${id}`);
    if (result.problem.status === 404) notFound();
    return <p className="p-10 text-center">{result.problem.code === "wedding.no_template" ? "Choose a template to preview your website." : result.problem.message}</p>;
  }
  if (tryKey && !template) notFound();
  const site = template && template.key !== result.data.template.key ? withTemplate(result.data, template) : result.data;
  return (
    <>
      <div className="sticky top-0 z-10 bg-ink px-4 py-1.5 text-center text-xs font-semibold text-white">
        {site === result.data ? "Private preview: not visible to guests" : `Private preview in ${site.template.name}: not applied yet`}
        {site === result.data ? <PreviewBarLinks weddingId={id} /> : null}
      </div>
      <SiteRenderer site={site} mode="preview" imageUrl={(img, variant) => `/api/media/${id}/${img.ref}/${variant}`} />
    </>
  );
}
