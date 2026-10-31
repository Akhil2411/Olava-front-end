"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * The signed-in header's link: "My weddings" for couples (current anywhere under /dashboard: a wedding's tabs, the
 * walkthrough, a new wedding), "Admin" for staff (current anywhere under /admin). Staff have no weddings of their own.
 */
export function DashboardNav({ staff }: { staff: boolean }) {
  const pathname = usePathname();
  const items = staff
    ? [{ href: "/admin", label: "Admin", on: pathname === "/admin" || pathname.startsWith("/admin/") }]
    : [{ href: "/dashboard", label: "My weddings", on: pathname === "/dashboard" || pathname.startsWith("/dashboard/") }];
  return (
    <nav aria-label="Account" className="flex items-center gap-1">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.on ? "page" : undefined}
          className={cn("rounded-full px-3 py-1.5 font-medium transition-colors",
            i.on ? "bg-tint font-semibold text-pink-deep" : "text-ink hover:text-pink-dark", i.href === "/dashboard" && "hidden sm:inline-block")}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
