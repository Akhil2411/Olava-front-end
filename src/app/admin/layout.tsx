import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/features/admin/components/AdminNav";
import { requireStaff } from "@/features/admin/data";
import { requireUser } from "@/lib/session/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
// Always per-request: every admin page depends on who is signed in.
export const dynamic = "force-dynamic";

/** Staff only: the server checks the role (requireStaff → API, which checks the database) before anything renders. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("/admin");
  const staff = await requireStaff();
  return (
    <div className="min-h-dvh bg-[#fdf8fa]">
      <AppHeader user={user} wide />
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:pt-6">
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <p className="mb-4 hidden px-3 text-xs text-mute lg:block">
            Signed in as <span className="font-semibold text-ink">{staff.isAdmin ? "Admin" : "Support"}</span>
          </p>
          <AdminNav />
        </aside>
        <main id="main" className="min-w-0 pt-4 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}
