"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/ui";
import { idle } from "@/lib/forms";
import { useKeepValuesSubmit } from "@/lib/useKeepValuesSubmit";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, idle);
  return (
    <form action={action} onSubmit={useKeepValuesSubmit(action)} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <FormMessage state={state} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required
        defaultValue={state.values?.email} errors={state.fieldErrors?.email} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required
        errors={state.fieldErrors?.password} />
      <div className="text-right">
        <Link href="/forgot-password" className="text-sm font-medium text-pink-dark hover:underline">Forgot password?</Link>
      </div>
      <SubmitButton block pending={pending} pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
