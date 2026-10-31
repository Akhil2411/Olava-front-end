import type { Metadata } from "next";
import { RsvpForm } from "@/features/public/RsvpForm";
import { Unavailable } from "@/features/public/Unavailable";
import { loadPublicSite, publicImageUrl } from "@/features/public/data";
import { ShareButtons } from "@/features/sharing/ShareButtons";
import { SiteRenderer } from "@/templates/SiteRenderer";
import { formatDate } from "@/lib/utils/format";

// Always rendered per request from the published snapshot, so unpublishing takes effect immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/w/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadPublicSite(slug);
  if (loaded.kind !== "ok") return { title: "Wedding website", robots: { index: false, follow: false } };
  const { couple } = loaded.data.site;
  const title = `${couple.partnerOneName} & ${couple.partnerTwoName}`;
  const description = couple.weddingDate
    ? `Join us on ${formatDate(couple.weddingDate)}. Event details, venue directions and RSVP.`
    : "Event details, venue directions and RSVP.";
  return {
    title: { absolute: `${title} · Wedding` },
    description,
    alternates: { canonical: loaded.data.publicUrl },
    // Decision: wedding sites are shareable by link but not listed in search engines (privacy by default).
    robots: { index: false, follow: false },
    openGraph: { type: "website", title, description, url: loaded.data.publicUrl, siteName: "Olava Invites" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicWeddingPage({ params }: PageProps<"/w/[slug]">) {
  const { slug } = await params;
  const loaded = await loadPublicSite(slug);
  if (loaded.kind === "unavailable") return <Unavailable />;
  if (loaded.kind === "ended") return <Unavailable ended />;
  if (loaded.kind === "error") {
    return <main id="main" className="grid min-h-dvh place-items-center p-6 text-center"><p>We couldn&apos;t load this website right now. Please try again in a moment.</p></main>;
  }

  const { site, publicUrl, shareText } = loaded.data;
  return (
    <main id="main">
      <SiteRenderer
        site={site}
        mode="public"
        imageUrl={publicImageUrl(slug)}
        renderRsvpForm={(labels) => <RsvpForm slug={slug} rsvp={site.rsvp} labels={labels} />}
        shareSlot={<ShareButtons url={publicUrl} text={shareText} tone="site" />}
      />
    </main>
  );
}
