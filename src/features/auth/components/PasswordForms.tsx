"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/ui";
import { idle } from "@/lib/forms";
import { useKeepValuesSubmit } from "@/lib/useKeepValuesSubmit";
import { forgotPasswordAction, resetPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, idle);
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      {state.status !== "success" ? (
        <>
          <TextField label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} errors={state.fieldErrors?.email} />
          <SubmitButton block pendingLabel="Sending…">Send reset link</SubmitButton>
        </>
      ) : null}
    </form>
  );
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, idle);
  return (
    <form action={action} onSubmit={useKeepValuesSubmit(action)} className="space-y-4" noValidate>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <TextField label="New password" name="password" type="password" autoComplete="new-password" required minLength={5}
        hint="At least 5 characters." errors={state.fieldErrors?.password} />
      <TextField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required errors={state.fieldErrors?.confirmPassword} />
      <SubmitButton block pending={pending} pendingLabel="Saving…">Set new password</SubmitButton>
    </form>
  );
}
