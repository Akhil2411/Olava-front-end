import type { RsvpLabels } from "../content";
import type { RenderContext } from "../types";
import { RsvpForm } from "./RsvpForm";

/**
 * The RSVP form for the current mode, used by every design:
 * - published site: the live form (`ctx.renderRsvpForm`, wired to the guest list);
 * - private preview and template gallery: the same form to try out, nothing is sent;
 * - editor: the same form, look-only, with a note that guests can reply once the site is published.
 * The design handles the "RSVPs closed" state for guests itself.
 */
export function RsvpBlock({ ctx, labels }: { ctx: RenderContext; labels: RsvpLabels }) {
  const { rsvp } = ctx.site;
  if (ctx.mode === "public" && ctx.renderRsvpForm) return <>{ctx.renderRsvpForm(labels)}</>;
  if (ctx.mode !== "edit") return <RsvpForm rsvp={rsvp} labels={labels} mode="try" />;
  return (
    <div className="olv-rsvp-edit">
      <p className="olv-rsvp-preview-note">
        {rsvp.isOpen
          ? "Preview: guests can reply once your website is published."
          : `RSVPs are closed, so guests see: “${labels.closed}”`}
      </p>
      <RsvpForm rsvp={rsvp} labels={labels} mode="edit" />
    </div>
  );
}
