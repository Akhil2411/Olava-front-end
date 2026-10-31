import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function AuthTabs({ active, next }: { active: "login" | "register"; next?: string }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  const tab = (key: "login" | "register", label: string) => (
    <Link href={`/${key}${q}`} aria-current={active === key ? "page" : undefined}
      className={cn("rounded-full p-2.5 text-center text-sm font-semibold", active === key ? "bg-white text-pink-dark shadow-[0_2px_8px_rgba(176,80,127,0.15)]" : "text-mute")}>
      {label}
    </Link>
  );
  return <nav aria-label="Account" className="my-6 grid grid-cols-2 rounded-full bg-tint p-1">{tab("login", "Sign in")}{tab("register", "Register")}</nav>;
}
