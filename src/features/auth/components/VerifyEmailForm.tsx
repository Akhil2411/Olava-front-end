"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Alert, Button, FormMessage, SubmitButton, TextField } from "@/components/ui";
import { idle } from "@/lib/forms";
import { resendCodeAction, verifyEmailAction, type ResendState, type VerifyState } from "../actions";

/** Seconds left until `at` (epoch ms), ticking once a second. */
function useCountdown(at: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (at <= now) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [at, now]);
  return Math.max(0, Math.ceil((at - now) / 1000));
}

export function VerifyEmailForm({ email, resendAt: initialResendAt, sent }: { email: string; resendAt: number; sent: boolean }) {
  const [state, action] = useActionState<VerifyState, FormData>(verifyEmailAction, idle);
  const [resend, setResend] = useState<ResendState>({ status: "idle", resendAt: initialResendAt });
  const [sending, startSending] = useTransition();
  const wait = useCountdown(resend.resendAt ?? 0);

  const ask = () => startSending(async () => setResend(await resendCodeAction()));

  return (
    <div className="space-y-5">
      {sent ? (
        <p className="text-mute">We&apos;ve sent a 6-digit code to <strong className="text-ink">{email}</strong>. Enter it below to confirm your email address.</p>
      ) : (
        <Alert tone="warning">We couldn&apos;t send the code to <strong>{email}</strong> just now. Use &ldquo;Send a new code&rdquo; to try again.</Alert>
      )}

      <form action={action} className="space-y-4" noValidate>
        <FormMessage state={state.status === "error" && !state.fieldErrors ? state : idle} />
        <TextField label="Verification code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*"
          maxLength={9} required autoFocus className="text-center text-2xl tracking-[0.4em]" errors={state.fieldErrors?.code}
          hint="Codes expire after a few minutes. If yours has, send a new one." />
        <SubmitButton block pendingLabel="Checking…">Confirm email</SubmitButton>
      </form>

      <div className="text-center text-sm" aria-live="polite">
        {resend.message ? <p className={resend.status === "sent" ? "mb-2 text-success" : "mb-2 text-danger"}>{resend.message}</p> : null}
        <Button type="button" variant={state.needsNewCode ? "primary" : "secondary"} size="sm" onClick={ask} loading={sending} disabled={wait > 0 || sending}>
          {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
        </Button>
        <p className="mt-4 text-mute">Wrong address? <Link href="/register" className="font-medium text-pink-dark hover:underline">Start again</Link></p>
      </div>
    </div>
  );
}
