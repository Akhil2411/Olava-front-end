"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/ui";
import { idle } from "@/lib/forms";
import { useKeepValuesSubmit } from "@/lib/useKeepValuesSubmit";
import { registerAction } from "../actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, idle);
  const onSubmit = useKeepValuesSubmit(action);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <TextField label="Full name" name="fullName" autoComplete="name" required defaultValue={state.values?.fullName} errors={state.fieldErrors?.fullName} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} errors={state.fieldErrors?.email} />
      <TextField label="Password" name="password" type="password" autoComplete="new-password" required minLength={5}
        hint="At least 5 characters." errors={state.fieldErrors?.password} />
      <TextField label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required errors={state.fieldErrors?.confirmPassword} />
      <SubmitButton block pending={pending} pendingLabel="Creating your account…">Create account</SubmitButton>
      <p className="text-center text-xs text-mute">By creating an account you agree to our terms and privacy policy.</p>
    </form>
  );
}
