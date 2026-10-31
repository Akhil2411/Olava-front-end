import { DESIGN_CSS, THEME_FONTS } from "../assets.generated";

/**
 * Loads a design's stylesheets and its theme's fonts as separate files (React hoists them into <head> and
 * waits for them before showing the design), so each wedding website downloads only its own design.
 * A file with a folder ("classic/base.css") is taken from that folder instead of the design's own.
 * `theme` is the colour theme (the palette key; for the Classic designs the design key), so templates added in the
 * admin panel for an existing theme get its fonts too.
 */
export function DesignAssets({ design, files, theme }: { design: string; files: string[]; theme: string }) {
  const sheets = ["shared/shared.css", ...files.map((f) => (f.includes("/") ? f : `${design}/${f}`))].map((k) => DESIGN_CSS[k]).filter(Boolean);
  const fonts = THEME_FONTS[theme];
  return (
    <>
      {fonts ? <link rel="stylesheet" href={fonts} precedence="olava-fonts" /> : null}
      {sheets.map((href) => <link key={href} rel="stylesheet" href={href} precedence="olava-design" />)}
    </>
  );
}
