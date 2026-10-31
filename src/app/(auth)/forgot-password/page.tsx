import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/PasswordForms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-1 mt-6 text-4xl">Forgot your password?</h1>
      <p className="mb-6 text-mute">Enter your email and we&apos;ll send you a link to choose a new one.</p>
      <ForgotPasswordForm />
    </>
  );
}
