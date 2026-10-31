import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui";
import { ResetPasswordForm } from "@/features/auth/components/PasswordForms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  const token = typeof sp.token === "string" ? sp.token : "";
  return (
    <>
      <h1 className="mb-6 mt-6 text-4xl">Choose a new password</h1>
      {email && token ? (
        <ResetPasswordForm email={email} token={token} />
      ) : (
        <Alert tone="error">This reset link is incomplete. <Link className="underline" href="/forgot-password">Request a new one</Link>.</Alert>
      )}
    </>
  );
}
