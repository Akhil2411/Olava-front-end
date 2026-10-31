import { Logo, LinkButton } from "@/components/ui";
import { getCurrentUser } from "@/lib/session/session";
import { isStaff } from "./AppHeader";
import { MainNav } from "./MainNav";
import { MobileMenu } from "./MobileMenu";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/templates", label: "Templates" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  // Signed in: couples go to their weddings, staff to the admin panel.
  const account = user ? (isStaff(user) ? { href: "/admin", label: "Admin" } : { href: "/dashboard", label: "My weddings" }) : null;
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-blush/90 backdrop-blur">
      <div className="wrap flex h-[68px] items-center justify-between gap-4">
        <Logo />
        <MainNav links={links} />
        <div className="hidden items-center gap-2.5 lg:flex">
          {account ? (
            <LinkButton href={account.href} size="sm">{account.label}</LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="secondary" size="sm">Sign in</LinkButton>
              <LinkButton href="/register" size="sm">Get started</LinkButton>
            </>
          )}
        </div>
        <MobileMenu links={links} account={account} />
      </div>
    </header>
  );
}
