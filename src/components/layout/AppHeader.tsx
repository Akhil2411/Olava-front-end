import { DashboardNav } from "@/components/layout/DashboardNav";
import { Logo } from "@/components/ui";
import { logoutAction } from "@/features/auth/actions";
import type { Me } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

/**
 * Staff (admins and support) run the platform: they see "Admin" instead of "My weddings" and don't make weddings of
 * their own (a personal account is for that). The admin pages and API check the role again on the server.
 */
export const isStaff = (user: Me) => user.platformRoles?.some((r) => r === "PlatformAdmin" || r === "Support") ?? false;

/** The signed-in header shared by the dashboard and the admin panel. */
export function AppHeader({ user, wide = false }: { user: Me; wide?: boolean }) {
  return (
    <header className="border-b border-line bg-white/90 backdrop-blur">
      <div className={cn("flex h-16 items-center justify-between gap-4", wide ? "px-4 sm:px-6" : "wrap")}>
        <Logo href={isStaff(user) ? "/admin" : "/dashboard"} height={34} />
        <div className="flex items-center gap-3 text-sm">
          <DashboardNav staff={isStaff(user)} />
          <span className="hidden max-w-[12rem] truncate text-mute md:inline" title={user.email}>{user.name}</span>
          <form action={logoutAction}>
            <button type="submit" className="rounded-full border border-line px-3 py-1.5 font-medium hover:bg-tint">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
