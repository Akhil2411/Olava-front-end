import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader, isStaff } from "@/components/layout/AppHeader";
import { requireUser } from "@/lib/session/session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("/dashboard");
  // Staff accounts don't have weddings of their own (the API refuses to create one): send them to the admin panel.
  if (isStaff(user)) redirect("/admin");
  return (
    <div className="min-h-dvh">
      <AppHeader user={user} />
      <main id="main" className="pb-16">{children}</main>
    </div>
  );
}
