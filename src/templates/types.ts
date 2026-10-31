import type { ReactNode } from "react";
import type { SiteModel } from "@/lib/api/types";
import type { RsvpLabels } from "./content";

/**
 * public  – the live site (published snapshot)
 * preview – the private draft preview
 * sample  – template gallery with sample data
 * edit    – the editor's live preview: elements are tappable and hidden/empty ones show as placeholders
 */
export type RenderMode = "public" | "preview" | "sample" | "edit";

export interface EditSelection {
  sectionId: string;
  /** Element within the section ("heading", "image", "blocks.<id>", "members.2"...), or "" for the whole section. */
  field: string;
}

export interface EditBinding {
  selected: EditSelection | null;
  onSelect: (selection: EditSelection) => void;
}

export interface RenderContext {
  site: SiteModel;
  mode: RenderMode;
  /** Resolves an image ref to a URL for the current mode (private editor route vs public route). */
  imageUrl: (image: { ref: string }, variant: "large" | "thumb" | "audio" | "video") => string | null;
  /** Interactive RSVP form (public mode only); gets the host's wording. Other modes show a placeholder. */
  renderRsvpForm?: (labels: RsvpLabels) => ReactNode;
  /** Share buttons (public mode only). */
  shareSlot?: ReactNode;
  /** Present in edit mode only. */
  edit?: EditBinding;
}

/** Layouts of the built-in fallback renderer (used only for a design the web app doesn't have yet). */
export type LayoutKey = "arch" | "classic" | "royal";
