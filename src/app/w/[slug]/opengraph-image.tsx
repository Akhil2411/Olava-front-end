import { ImageResponse } from "next/og";
import { loadPublicSite } from "@/features/public/data";
import { formatDate } from "@/lib/utils/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Wedding website preview";

/** Dynamic social preview card (WhatsApp/Facebook/X) in the couple's template colours. */
export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadPublicSite(slug);
  const site = loaded.kind === "ok" ? loaded.data.site : null;
  const palette = site?.theme.palette ?? { background: "#fff4f7", accent: "#b0507f", text: "#2b1f25" };
  const names = site ? `${site.couple.partnerOneName} & ${site.couple.partnerTwoName}` : "Olava Invites";
  const date = site?.couple.weddingDate ? formatDate(site.couple.weddingDate) : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: palette.background, color: palette.text }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", border: `3px solid ${palette.accent}`, borderRadius: 32, padding: "60px 90px" }}>
          <div style={{ fontSize: 26, letterSpacing: 8, textTransform: "uppercase", color: palette.accent }}>{site ? "The wedding of" : "Wedding websites"}</div>
          <div style={{ fontSize: 92, fontStyle: "italic", color: palette.accent, marginTop: 24 }}>{names}</div>
          {date ? <div style={{ fontSize: 34, marginTop: 24 }}>{date}</div> : null}
        </div>
      </div>
    ),
    size,
  );
}
