/** A dress-code item's colour story: overlapping colour dots (shared by every design; styled in shared.css). */
export function Swatches({ colors, className = "" }: { colors?: string[] | null; className?: string }) {
  const valid = (colors ?? []).filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 5);
  if (valid.length === 0) return null;
  return (
    <p className={`olv-swatches ${className}`.trim()} aria-hidden="true">
      {valid.map((c, i) => <i key={i} style={{ background: c }} />)}
    </p>
  );
}
