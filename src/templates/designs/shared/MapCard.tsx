import type { RenderContext } from "../../types";
import { SiteLink } from "../../Editable";

/**
 * "Open in Maps" card: a small illustrated street map in the design's colours (no embedded Google map, no
 * tracking) that opens the venue in the guest's maps app. Colours come from --map-* variables set by the design.
 */
export function MapCard({ ctx, href, name, address, label, id }: {
  ctx: RenderContext; href: string; name: string; address: string | null; label: string; id: string;
}) {
  return (
    <SiteLink ctx={ctx} href={href} className="olv-map">
      <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="olv-map-art">
        <defs>
          <pattern id={`grid-${id}`} width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
            <path d="M0 0H28M0 0V28" stroke="var(--map-street)" strokeWidth="1" opacity=".55" />
          </pattern>
        </defs>
        <rect width="400" height="180" fill="var(--map-land)" />
        <rect width="400" height="180" fill={`url(#grid-${id})`} />
        <path d="M-10 132 C 90 108, 150 150, 250 118 S 380 92, 420 104" stroke="var(--map-water)" strokeWidth="16" fill="none" opacity=".7" />
        <path d="M-10 60 L 420 34" stroke="var(--map-road)" strokeWidth="7" fill="none" />
        <path d="M120 -10 L 168 190" stroke="var(--map-road)" strokeWidth="6" fill="none" />
        <path d="M300 -10 C 288 60, 300 120, 276 190" stroke="var(--map-road)" strokeWidth="5" fill="none" />
        <circle cx="200" cy="82" r="30" fill="var(--map-pin)" opacity=".14" />
        <path d="M200 98s-17-15.5-17-28.5a17 17 0 0 1 34 0C217 82.5 200 98 200 98z" fill="var(--map-pin)" />
        <circle cx="200" cy="69.5" r="6" fill="var(--map-land)" />
      </svg>
      <span className="olv-map-body">
        <span className="olv-map-name">{name}</span>
        {address ? <span className="olv-map-addr">{address}</span> : null}
        <span className="olv-map-cta">
          {label}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
        </span>
      </span>
    </SiteLink>
  );
}
