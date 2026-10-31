import type React from "react";
import Link from "next/link";
import { Alert, LinkButton, StatusBadge } from "@/components/ui";
import { WeddingNav } from "@/components/dashboard/WeddingNav";
import { SectionContent } from "@/components/loading/SectionLoading";
import { getTemplates } from "@/features/catalog/data";
import { getWedding } from "@/features/weddings/data";
import { readableThemeColor } from "@/lib/utils/color";
import { formatDate } from "@/lib/utils/format";

export default async function WeddingLayout({ children, params }: LayoutProps<"/dashboard/weddings/[id]">) {
  const { id } = await params;
  const [wedding, templates] = await Promise.all([getWedding(id), getTemplates()]);
  // The section loader takes the active template's colour (darker palette colour if the accent is too light here).
  const template = templates.find((t) => t.key === wedding.template?.key);
  const palette = template?.palettes.find((p) => p.key === wedding.theme.palette)
    ?? template?.palettes.find((p) => p.key === template.defaultPalette);
  const loaderColor = readableThemeColor(palette);
  return (
    <div className="wrap pt-6" style={{ "--loader-color": loaderColor } as React.CSSProperties}>
      <Link href="/dashboard" className="text-sm text-mute hover:text-ink">← My weddings</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-4xl sm:text-5xl">{wedding.partnerOneName} &amp; {wedding.partnerTwoName}</h1>
            <StatusBadge status={wedding.status} />
          </div>
          <p className="mt-1 text-sm text-mute">
            {wedding.weddingDate ? formatDate(wedding.weddingDate) : "Date not set"}
            {wedding.template ? ` · ${wedding.template.name}` : ""}
          </p>
        </div>
        <LinkButton href={`/dashboard/weddings/${id}/preview`} variant="secondary" size="sm">👁 Preview</LinkButton>
      </div>
      {wedding.status === "Archived" ? (
        <Alert tone="warning" className="mt-4">This wedding is archived. Restore it in Settings to make changes.</Alert>
      ) : wedding.status === "Published" && wedding.hasUnpublishedChanges ? (
        <Alert tone="info" className="mt-4" action={<LinkButton href={`/dashboard/weddings/${id}/publish`} size="sm">Review &amp; republish</LinkButton>}>
          You have changes that aren&apos;t live yet. Guests see the last published version until you republish.
        </Alert>
      ) : null}
      <div className="mt-5"><WeddingNav weddingId={id} /></div>
      <div className="pt-6"><SectionContent>{children}</SectionContent></div>
    </div>
  );
}
