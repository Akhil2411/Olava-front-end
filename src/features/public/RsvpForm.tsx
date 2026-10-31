"use client";

import { useActionState } from "react";
import type { SiteModel } from "@/lib/api/types";
import { idle } from "@/lib/forms";
import { RSVP_LABEL_DEFAULTS, type RsvpLabels } from "@/templates/content";
import { RsvpForm as RsvpFormView } from "@/templates/rsvp/RsvpForm";
import { submitRsvpAction } from "./actions";

/** Guest RSVP form on the published site (no account needed): the shared form, wired to the guest list. */
export function RsvpForm({ slug, rsvp, labels = RSVP_LABEL_DEFAULTS }: { slug: string; rsvp: SiteModel["rsvp"]; labels?: RsvpLabels }) {
  const [state, action] = useActionState(submitRsvpAction.bind(null, slug), idle);
  return <RsvpFormView rsvp={rsvp} labels={labels} mode="live" action={action} state={state} />;
}
