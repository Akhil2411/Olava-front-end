import Link from "next/link";
import { Logo } from "@/components/ui";
import { getSiteContent } from "@/features/admin/data";

const SOCIAL = [["instagram", "Instagram"], ["facebook", "Facebook"], ["youTube", "YouTube"], ["pinterest", "Pinterest"], ["x", "X"]] as const;

export async function SiteFooter() {
  // Site details and social links come from Admin → Settings.
  const site = (await getSiteContent())?.site;
  const name = site?.siteName || "Olava Invites";
  const social = SOCIAL.filter(([k]) => site?.social[k]);
  const wa = site?.whatsApp?.replace(/[^\d]/g, "");
  const contact = site && (site.contactEmail || site.contactPhone || wa);
  return (
    <footer className="border-t border-line bg-white py-12 text-sm">
      <div className="wrap grid gap-8 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1.3fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-mute">{site?.tagline || "Elegant digital wedding websites, made with love."}</p>
          {social.length ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Follow us">
              {social.map(([k, label]) => <li key={k}><a href={site!.social[k]!} target="_blank" rel="noopener noreferrer" className="text-mute hover:text-ink">{label}</a></li>)}
            </ul>
          ) : null}
        </div>
        <FooterCol title="Product" links={[["/templates", "Templates"], ["/#features", "Features"], ["/#pricing", "Pricing"]]} />
        <FooterCol title="Help" links={[["/#faq", "FAQ"], ["/#how-it-works", "How it works"]]} />
        <FooterCol title="Legal" links={[["/privacy", "Privacy"], ["/terms", "Terms"]]} />
        {contact ? (
          <div>
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-pink-dark">Contact</h4>
            {site.contactEmail ? <a href={`mailto:${site.contactEmail}`} className="block break-all py-1 text-mute hover:text-ink">{site.contactEmail}</a> : null}
            {site.contactPhone ? <a href={`tel:${site.contactPhone.replace(/\s/g, "")}`} className="block py-1 text-mute hover:text-ink">{site.contactPhone}</a> : null}
            {wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="block py-1 text-mute hover:text-ink">WhatsApp us</a> : null}
          </div>
        ) : null}
      </div>
      <p className="wrap mt-8 border-t border-line pt-5 text-center text-mute">© {new Date().getFullYear()} {name}. All rights reserved.</p>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-pink-dark">{title}</h4>
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="block py-1 text-mute hover:text-ink">{label}</Link>
      ))}
    </div>
  );
}
