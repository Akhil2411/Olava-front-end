import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Alert, LinkButton } from "@/components/ui";
import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";
import { VERIFY_COOKIE, isPendingVerification, readJsonCookie } from "@/features/auth/pending";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false } };

export default async function VerifyEmailPage() {
  const pending = readJsonCookie<unknown>((await cookies()).get(VERIFY_COOKIE)?.value);
  return (
    <>
      <h1 className="mb-4 mt-6 text-4xl">Check your <em className="text-pink-dark">email</em></h1>
      {isPendingVerification(pending) ? (
        <VerifyEmailForm email={pending.email} resendAt={pending.resendAt} sent={pending.sent} />
      ) : (
        <Alert tone="info" action={<LinkButton href="/login" size="sm">Sign in</LinkButton>}>
          This step timed out. Sign in with your email and password and we&apos;ll send you a new code.
        </Alert>
      )}
    </>
  );
}
