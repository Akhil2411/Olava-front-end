import type { Metadata } from "next";
import { AuthTabs } from "@/features/auth/components/AuthTabs";
import { GoogleButton } from "@/features/auth/components/GoogleButton";
import { googleSignInConfig } from "@/features/auth/google";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { Alert } from "@/components/ui";
import { getSiteContent } from "@/features/admin/data";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const [google, content] = await Promise.all([googleSignInConfig(), getSiteContent()]);
  const closed = content?.signupsOpen === false;
  return (
    <>
      <h1 className="mt-6 text-4xl">Begin your <em className="text-pink-dark">story</em></h1>
      <p className="mt-1 text-mute">Create an account to design your wedding website. It&apos;s free until you publish.</p>
      <AuthTabs active="register" next={typeof sp.next === "string" ? sp.next : undefined} />
      {closed ? (
        <Alert tone="info" className="mt-6">We&apos;re not accepting new accounts right now. Please check back soon. Already have an account? Sign in instead.</Alert>
      ) : (
        <>
          {google ? <GoogleButton label="Sign up with Google" /> : null}
          <RegisterForm />
        </>
      )}
    </>
  );
}
