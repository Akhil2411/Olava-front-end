"use client";

import type { ReactNode } from "react";
import { PreviewWindow } from "@/features/preview/PreviewWindow";
import type { Template } from "@/lib/api/types";

/**
 * Live preview of a template in a real-size device frame. The gallery points it at sample data; the editor's
 * picker and the walkthrough point it at the wedding's saved draft rendered with that template.
 */
export function TemplatePreviewModal({ template, src, note, children, action, onClose }: {
  template: Template | null; src: string; note: ReactNode; children?: ReactNode;
  /** The main button (e.g. "Choose this design"), in the top bar so it's visible without scrolling. */
  action?: ReactNode;
  onClose: () => void;
}) {
  return (
    <PreviewWindow open={template !== null} title={template ? `${template.name} preview` : ""} src={src} note={note} action={action} onClose={onClose}>
      {children}
    </PreviewWindow>
  );
}
