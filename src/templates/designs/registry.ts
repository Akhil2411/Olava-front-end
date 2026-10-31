import type { ReactNode } from "react";
import type { RenderContext } from "../types";
import { BlackTie } from "./black-tie/BlackTie";
import { EnglishGarden } from "./english-garden/EnglishGarden";
import { Heirloom } from "./heirloom/Heirloom";
import { IvoryLetterpress } from "./ivory-letterpress/IvoryLetterpress";
import { Riviera } from "./riviera/Riviera";
import { Cinematic } from "./cinematic/Cinematic";
import { EnchantedGarden } from "./enchanted-garden/EnchantedGarden";
import { ModernIndian } from "./modern-indian/ModernIndian";

/**
 * The wedding-site designs built into the web app, by template layout key (template definition "layout").
 * A template whose design isn't here yet renders with the built-in fallback and is hidden from the template
 * gallery, so the catalogue can list a template before its design ships. See docs/adding-templates.md.
 */
export const DESIGNS: Record<string, (ctx: RenderContext) => ReactNode> = {
  "enchanted-garden": EnchantedGarden,
  "modern-indian": ModernIndian,
  "black-tie": BlackTie,
  "english-garden": EnglishGarden,
  heirloom: Heirloom,
  "ivory-letterpress": IvoryLetterpress,
  riviera: Riviera,
  cinematic: Cinematic,
};

export const hasDesign = (layout: string) => layout in DESIGNS;
