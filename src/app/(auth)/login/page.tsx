import type { Metadata } from "next";
import { Alert } from "@/components/ui";
import { AuthTabs } from "@/features/auth/components/AuthTabs";
import { GoogleButton } from "@/features/auth/components/GoogleButton";
import { googleSignInConfig } from "@/features/auth/google";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  google: "We couldn't sign you in with Google. Please try again.",
  google_cancelled: "Google sign-in was cancelled.",
  google_unverified: "Your Google account's email address isn't verified, so it can't be used to sign in.",
  google_unavailable: "Google sign-in isn't available right now. Please use your email and password.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const error = typeof sp.error === "string" ? ERRORS[sp.error] ?? ERRORS.google : null;
  const google = await googleSignInConfig();
  return (
    <>
      <h1 className="mt-6 text-4xl">Welcome <em className="text-pink-dark">back</em></h1>
      <p className="mt-1 text-mute">Sign in to continue crafting your wedding website.</p>
      <AuthTabs active="login" next={next} />
      {sp.reset ? <Alert tone="success" className="mb-4">Your password has been changed. Please sign in.</Alert> : null}
      {sp.verified ? <Alert tone="success" className="mb-4">Your email address is confirmed. Please sign in.</Alert> : null}
      {error ? <Alert tone="error" className="mb-4">{error}</Alert> : null}
      {google ? <GoogleButton next={next} /> : null}
      <LoginForm next={next} />
    </>
  );
}
