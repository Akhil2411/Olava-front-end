import { Alert } from "@/components/ui";
import { getTemplates } from "@/features/catalog/data";
import { TemplatePicker } from "@/features/design/components/TemplatePicker";
import { EditorTip } from "@/features/editor/EditorTip";
import { SiteEditor } from "@/features/editor/SiteEditor";
import { getEvents, getMedia, getMusic, getPreview, getPublishing, getSectionsData, getVenues, getWedding } from "@/features/weddings/data";

export default async function DesignPage({ params, searchParams }: PageProps<"/dashboard/weddings/[id]/design">) {
  const { id } = await params;
  const sp = await searchParams;
  // One round of parallel requests (was two in a row). Sections/preview of a wedding without a template are
  // simply unused.
  const [wedding, templates, publishing, data, media, preview, music, events, venues] = await Promise.all([
    getWedding(id), getTemplates(), getPublishing(id), getSectionsData(id), getMedia(id), getPreview(id), getMusic(id), getEvents(id), getVenues(id),
  ]);
  const readOnly = wedding.status === "Archived";
  const entitledRank = publishing.entitlement?.tierRank ?? null;

  if (!wedding.template) {
    return (
      <div className="space-y-6">
        <Alert tone="info" title="Choose a design to see your website">Tap a design to use it. Your details, events and photos carry over, and you can switch again any time.</Alert>
        <TemplatePicker wedding={wedding} templates={templates} entitledRank={entitledRank} readOnly={readOnly} />
      </div>
    );
  }

  if (!preview.ok) return <Alert tone="error">{preview.problem.message}</Alert>;
  return (
    <div className="space-y-4">
      <EditorTip />
      <SiteEditor key={wedding.template.key} wedding={wedding} preview={preview.data} sections={data.sections} library={data.library}
        media={media} music={music} events={events} venues={venues} templates={templates} entitledRank={entitledRank} readOnly={readOnly}
        initialSection={typeof sp.section === "string" ? sp.section : undefined} initialPanel={sp.panel === "template" ? "template" : undefined} />
    </div>
  );
}
