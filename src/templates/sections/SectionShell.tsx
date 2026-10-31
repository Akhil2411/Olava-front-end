import type { ReactNode } from "react";
import type { SiteSection } from "@/lib/api/types";
import { textEl } from "../content";
import { Editable, SectionEditChip } from "../Editable";
import type { RenderContext } from "../types";

/**
 * Standard section frame: eyebrow, heading and optional intro (all editable and hideable), then the body.
 * Layout and styling come from the template's theme variables; content comes from the host.
 */
export function SectionShell({ ctx, section, anchor, name, children, tone = "plain", intro = true }: {
  ctx: RenderContext;
  section: SiteSection;
  /** Stable HTML id for in-page links (e.g. "story"); repeated sections get a numbered suffix from the renderer. */
  anchor: string;
  /** Section name for the editor ("Our story"). */
  name: string;
  children: ReactNode;
  tone?: "plain" | "surface";
  intro?: boolean;
}) {
  const eyebrow = textEl(section.content, "eyebrow");
  const heading = textEl(section.content, "heading");
  const introEl = textEl(section.content, "intro");
  const showEyebrow = !eyebrow.hidden && !!eyebrow.text;
  const showHeading = !heading.hidden && !!heading.text;
  const showIntro = intro && !introEl.hidden && !!introEl.text;
  const edit = ctx.mode === "edit";

  return (
    <section id={anchor} aria-labelledby={showHeading ? `${anchor}-title` : undefined}
      className={tone === "surface" ? "bg-[var(--s-surface)] px-5 py-16 sm:py-20" : "px-5 py-16 sm:py-20"}>
      <SectionEditChip ctx={ctx} section={section} name={name} />
      <div className="mx-auto max-w-4xl">
        {showEyebrow || showHeading || showIntro || edit ? (
          <div className="mb-10 text-center">
            <Editable ctx={ctx} section={section} field="eyebrow" label="Small label" show={showEyebrow} hidden={eyebrow.hidden} className="mb-3">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--s-accent)]">{eyebrow.text}</p>
            </Editable>
            <Editable ctx={ctx} section={section} field="heading" label="Heading" show={showHeading} hidden={heading.hidden}>
              <h2 id={`${anchor}-title`} className="font-[family-name:var(--s-heading)] text-4xl sm:text-5xl">{heading.text}</h2>
            </Editable>
            {intro ? (
              <Editable ctx={ctx} section={section} field="intro" label="Introduction" show={showIntro} hidden={introEl.hidden} className="mt-4">
                <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-[var(--s-muted)]">{introEl.text}</p>
              </Editable>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
