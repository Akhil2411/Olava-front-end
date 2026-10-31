import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { midSentence } from "@/lib/utils/format";
import "./editable.css";
import type { SiteSection } from "@/lib/api/types";
import { SAMPLE_NOTE } from "./samples";
import type { RenderContext } from "./types";

/**
 * Wraps one element of a section. On the site it renders the element only when `show` is true.
 * In the editor (mode "edit") it makes the element tappable (opens its editor) and shows hidden or
 * empty elements as a faint placeholder so they can be brought back.
 */
export function Editable({ ctx, section, field, label, show, hidden = false, inline = false, placeholderWhenEmpty = true, photo, className, children }: {
  ctx: RenderContext;
  section: SiteSection;
  field: string;
  /** What this element is, for the screen-reader label ("Edit heading"). */
  label: string;
  show: boolean;
  hidden?: boolean;
  inline?: boolean;
  /** False for elements whose data lives elsewhere (date, venue): nothing to add here, so no placeholder. */
  placeholderWhenEmpty?: boolean;
  /**
   * A photo: the editor marks it with a "Change photo" chip so it's clear it can be tapped. On by default for the
   * section photo ("image") and event cover photos ("events.N.cover"); pass false where the element isn't the photo.
   */
  photo?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  if (ctx.mode !== "edit" || !ctx.edit || !section.id) return show ? <>{children}</> : null;
  if (!show && !hidden && !placeholderWhenEmpty) return null;

  const sectionId = section.id;
  const { edit } = ctx;
  const selected = edit.selected?.sectionId === sectionId && edit.selected.field === field;
  const select = () => edit.onSelect({ sectionId, field });
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
  };
  const Tag = inline ? "span" : "div";
  const chip = show && (photo ?? (field === "image" || /^events\.\d+\.cover$/.test(field)));

  return (
    <Tag
      role="button"
      tabIndex={0}
      aria-label={`Edit ${label}${hidden ? " (hidden)" : !show ? " (empty)" : ""}`}
      aria-pressed={selected}
      data-edit-field={field}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); select(); }}
      onKeyDown={onKeyDown}
      className={cn(
        "cursor-pointer rounded-md outline-2 outline-offset-4 transition-[outline-color]",
        selected ? "outline outline-[var(--s-accent)]" : "outline-dashed outline-transparent hover:outline-[var(--s-accent)]/60 focus-visible:outline-[var(--s-accent)]",
        inline ? "inline-block" : "block",
        className,
      )}
    >
      {/* No top/left: it sits at the photo's top-left corner without making this element a positioned box. */}
      {chip ? <span className="olv-photo-chip" aria-hidden="true">📷 Change photo</span> : null}
      {show ? children : (
        <span className="olv-edit-ph">
          {hidden ? `${label} hidden · tap to show` : `Add ${midSentence(label)}`}
        </span>
      )}
    </Tag>
  );
}

/** In the editor, links must not navigate (and can't be nested inside tappable elements). */
export function SiteLink({ ctx, href, className, children, newTab = true }: {
  ctx: RenderContext; href: string | null; className?: string; children: ReactNode; newTab?: boolean;
}) {
  if (!href || ctx.mode === "edit") return <span className={className}>{children}</span>;
  const external = /^https:/i.test(href) && newTab;
  return (
    <a href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}

/**
 * "Edit section" chip shown at the top of each section in the editor, and the "Sample" tag on a section that
 * shows sample content because it's still empty (editor and private preview; never on the live site).
 */
export function SectionEditChip({ ctx, section, name }: { ctx: RenderContext; section: SiteSection; name: string }) {
  const editing = ctx.mode === "edit" && !!ctx.edit && !!section.id;
  const sample = !!section.sample && (ctx.mode === "edit" || ctx.mode === "preview");
  if (!editing && !sample) return null;
  const sectionId = section.id;
  const edit = ctx.edit;
  const open = () => { if (edit && sectionId) edit.onSelect({ sectionId, field: "" }); };
  const note = SAMPLE_NOTE.replace(/^Sample: /, "");
  return (
    <>
      {editing ? (
        <div className="olv-edit-chip-row">
          <button type="button" onClick={open} className="olv-edit-chip">
            ✎ {name}
          </button>
        </div>
      ) : null}
      {sample ? (
        // Its own line in the page flow, above the section's content, so it never covers anything.
        <div className="olv-sample-row">
          {editing ? (
            <button type="button" onClick={open} className="olv-sample-tag" data-olava-sample=""><b>Sample</b> <span>{note}</span></button>
          ) : (
            <p className="olv-sample-tag" data-olava-sample=""><b>Sample</b> <span>{note}</span></p>
          )}
        </div>
      ) : null}
    </>
  );
}
