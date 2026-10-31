"use client";

import { useActionState } from "react";
import { FormMessage, SelectField, SubmitButton, TextField } from "@/components/ui";
import { idle } from "@/lib/forms";
import { createWeddingAction } from "../actions";
import { TIME_ZONES } from "../timezones";

export function CreateWeddingForm({ initialTemplate }: { initialTemplate?: string }) {
  const [state, action] = useActionState(createWeddingAction, idle);
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Partner one" name="partnerOneName" required autoComplete="off" placeholder="Priya" defaultValue={v.partnerOneName} errors={state.fieldErrors?.partnerOneName} />
        <TextField label="Partner two" name="partnerTwoName" required autoComplete="off" placeholder="Arjun" defaultValue={v.partnerTwoName} errors={state.fieldErrors?.partnerTwoName} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Wedding date" name="weddingDate" type="date" hint="You can add this later." defaultValue={v.weddingDate} errors={state.fieldErrors?.weddingDate} />
        <SelectField label="Time zone" name="timeZoneId" defaultValue={v.timeZoneId ?? "Asia/Kolkata"} errors={state.fieldErrors?.timeZoneId}>
          {TIME_ZONES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </SelectField>
      </div>
      {/* The design is chosen on the next step, visually (a template picked in the gallery arrives preselected). */}
      {initialTemplate ? <input type="hidden" name="templateKey" value={v.templateKey ?? initialTemplate} /> : null}
      <SubmitButton pendingLabel="Creating…" size="lg">Next: choose your design</SubmitButton>
      <p className="text-xs text-mute">Your website starts as a private draft. Nothing is visible to anyone until you publish.</p>
    </form>
  );
}
