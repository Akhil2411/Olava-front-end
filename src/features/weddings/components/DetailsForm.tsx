"use client";

import { useActionState } from "react";
import { FormMessage, SelectField, SubmitButton, TextField } from "@/components/ui";
import type { Wedding } from "@/lib/api/types";
import { idle } from "@/lib/forms";
import { updateWeddingAction } from "../actions";
import { TIME_ZONES } from "../timezones";

export function DetailsForm({ wedding, publicBase }: { wedding: Wedding; publicBase: string }) {
  const [state, action] = useActionState(updateWeddingAction.bind(null, wedding.id), idle);
  const v = state.values;
  const val = (key: keyof Wedding) => v?.[key] ?? (wedding[key] as string | null) ?? "";
  const disabled = wedding.status === "Archived";
  const zones = TIME_ZONES.some(([id]) => id === wedding.timeZoneId) ? TIME_ZONES : [[wedding.timeZoneId, wedding.timeZoneId] as const, ...TIME_ZONES];

  return (
    <form action={action} className="space-y-6" noValidate>
      <FormMessage state={state} />
      <fieldset disabled={disabled} className="space-y-6">
        <legend className="sr-only">Wedding details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Partner one" name="partnerOneName" required defaultValue={val("partnerOneName")} errors={state.fieldErrors?.partnerOneName} />
          <TextField label="Partner two" name="partnerTwoName" required defaultValue={val("partnerTwoName")} errors={state.fieldErrors?.partnerTwoName} />
        </div>
        <TextField label="Website title" name="title" required defaultValue={val("title")} hint="Shown in browser tabs and link previews." errors={state.fieldErrors?.title} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Wedding date" name="weddingDate" type="date" defaultValue={val("weddingDate")} hint="Needed before publishing." errors={state.fieldErrors?.weddingDate} />
          <SelectField label="Time zone" name="timeZoneId" defaultValue={val("timeZoneId")} hint="Event times are shown in this time zone." errors={state.fieldErrors?.timeZoneId}>
            {zones.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </SelectField>
        </div>
        <SelectField label="Language" name="preferredLanguage" defaultValue="en" hint="More languages are planned.">
          <option value="en">English</option>
        </SelectField>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Contact email" name="contactEmail" type="email" defaultValue={val("contactEmail")}
            hint="Private unless you show it in the Contact section." errors={state.fieldErrors?.contactEmail} />
          <TextField label="Contact phone" name="contactPhone" type="tel" defaultValue={val("contactPhone")}
            hint="Private unless you show it in the Contact section." errors={state.fieldErrors?.contactPhone} />
        </div>
        <TextField
          label="Web address"
          name="slug"
          required
          defaultValue={val("slug")}
          readOnly={wedding.slugLocked}
          pattern="[a-z0-9-]{3,63}"
          hint={wedding.slugLocked
            ? `${publicBase}/w/${wedding.slug} is locked because your site has been published (printed links and QR codes stay valid).`
            : `${publicBase}/w/your-address · lower-case letters, numbers and hyphens. Locked after you first publish.`}
          errors={state.fieldErrors?.slug}
        />
        <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
      </fieldset>
    </form>
  );
}
