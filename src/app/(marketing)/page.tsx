import { Card, LinkButton } from "@/components/ui";
import { getTemplates, getTiers } from "@/features/catalog/data";
import { TemplateGallery } from "@/features/catalog/TemplateGallery";
import { HeroShowcase } from "@/features/catalog/HeroShowcase";
import { pickShowcase } from "@/features/catalog/showcase";
import { DeviceRow, Sprig } from "@/features/catalog/DeviceRow";
import { getSiteContent } from "@/features/admin/data";
import { formatMoney } from "@/lib/utils/format";

// Copy follows the BRD: no invented statistics or testimonials; prices come from the API.
const features = [
  { icon: "💌", title: "Designer templates", body: "Hand-crafted floral, classic and traditional layouts you can personalise in minutes." },
  { icon: "✅", title: "Guest RSVP", body: "Guests reply from their phone without an account. Track responses and plus-ones live." },
  { icon: "📍", title: "Events & maps", body: "Mehendi, haldi, ceremony, reception: every function with its venue, time, dress code and directions." },
  { icon: "📸", title: "Photo gallery", body: "Upload, caption and arrange your favourite photos. Remove any of them at any time." },
  { icon: "🔗", title: "Share anywhere", body: "One link for WhatsApp, email or print, plus a QR code that never changes." },
  { icon: "🔒", title: "Private until you publish", body: "Design and preview for free. Nothing is public until you choose to publish." },
];

const steps = [
  { title: "Create & choose a design", body: "Sign up, add your names and date, and pick a template. Preview it on mobile, tablet and desktop." },
  { title: "Add your details for free", body: "Events, venues, your story, photos and RSVP settings. Your draft stays private while you work." },
  { title: "Publish & share", body: "Choose your package, publish, then share your link or QR code on WhatsApp and printed cards." },
];


export default async function HomePage() {
  const [templates, tiers, content] = await Promise.all([getTemplates(), getTiers(), getSiteContent()]);
  // Admin → Home page choice; unset (or no longer offered) falls back to the default.
  const showcase = pickShowcase(templates, content?.home.showcaseTemplate);
  const featured = (content?.home.featuredTemplates ?? []).map((k) => templates.find((t) => t.key === k)).filter((t) => t !== undefined);
  const faqs = content?.faqs ?? [];

  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0,#fde3ee,transparent_60%)] pb-14 pt-10 sm:pt-16">
        <Sprig className="-right-6 -top-4 w-28 rotate-[200deg] sm:w-36" />
        <Sprig className="-bottom-6 -left-8 hidden w-32 rotate-[20deg] sm:block sm:w-44" />
        <div className="wrap relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:gap-12">
          <div>
            <p className="eyebrow">Digital wedding websites</p>
            <h1 className="text-[clamp(40px,9vw,76px)]">Invitations as beautiful as your <em className="text-pink-dark">love story</em></h1>
            <p className="mb-7 mt-5 max-w-lg text-lg text-mute">
              Create an elegant wedding website in minutes. Share it with a link or QR code, collect RSVPs and keep every guest informed.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton href="/register" size="lg">Start designing</LinkButton>
              <LinkButton href="/templates" variant="secondary" size="lg">Browse templates</LinkButton>
            </div>
            <p className="mt-3 text-sm text-mute">Design and preview free. Pay once when you publish.</p>
            <DeviceRow className="mt-9" />
          </div>
          {showcase ? <HeroShowcase template={showcase} /> : null}
        </div>
      </section>

      <section id="features" className="py-16">
        <div className="wrap">
          <div className="text-center">
            <p className="eyebrow">Everything you need</p>
            <h2 className="text-[clamp(30px,6vw,48px)]">One place for your whole celebration</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-tint text-2xl" aria-hidden="true">{f.icon}</div>
                <h3 className="mb-1.5 text-2xl">{f.title}</h3>
                <p className="text-[15px] text-mute">{f.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-16">
        <div className="wrap">
          <div className="text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="text-[clamp(30px,6vw,48px)]">Three simple steps</h2>
          </div>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-[22px] border border-line bg-blush p-6">
                <span className="font-serif text-5xl text-pink-dark" aria-hidden="true">0{i + 1}</span>
                <h3 className="mb-1.5 mt-2 text-2xl">{s.title}</h3>
                <p className="text-[15px] text-mute">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {templates.length > 0 ? (
        <section className="py-16">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Our designs</p>
                <h2 className="text-[clamp(30px,6vw,48px)]">Find the one that feels like you</h2>
              </div>
              <LinkButton href="/templates" variant="ghost">View all templates →</LinkButton>
            </div>
            <TemplateGallery templates={featured.length ? featured : templates.slice(0, 3)} compact />
          </div>
        </section>
      ) : null}

      {tiers.length > 0 ? (
        <section id="pricing" className="bg-white py-16">
          <div className="wrap">
            <div className="text-center">
              <p className="eyebrow">Pricing</p>
              <h2 className="text-[clamp(30px,6vw,48px)]">Pay once, when you publish</h2>
              <p className="mx-auto mt-3 max-w-xl text-mute">Designing and previewing are free. Each template belongs to a package; you can upgrade later and pay only the difference.</p>
            </div>
            <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
              {tiers.map((tier) => (
                <Card key={tier.code} className={tier.rank > 1 ? "border-pink-dark" : ""}>
                  <h3 className="text-3xl">{tier.name}</h3>
                  <p className="mt-1 text-sm text-mute">{tier.description}</p>
                  <p className="mt-4 font-serif text-5xl text-pink-dark">{formatMoney(tier.priceMinor, tier.currency)}</p>
                  <p className="text-xs text-mute">one-time, per wedding</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {tier.features.map((f) => <li key={f} className="flex gap-2"><span aria-hidden="true" className="text-success">✓</span>{f}</li>)}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {faqs.length ? <section id="faq" className="py-16">
        <div className="wrap max-w-3xl">
          <div className="text-center">
            <p className="eyebrow">Questions</p>
            <h2 className="text-[clamp(30px,6vw,48px)]">Good to know</h2>
          </div>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.id} className="rounded-2xl border border-line bg-white px-5 py-4">
                <summary className="cursor-pointer font-semibold">{f.question}</summary>
                <p className="mt-2 whitespace-pre-line text-[15px] text-mute">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section> : null}

      <section className="pb-20">
        <div className="wrap">
          <div className="rounded-[28px] bg-gradient-to-br from-[#c4628f] to-pink-deep px-6 py-12 text-center text-white">
            <h2 className="text-[clamp(30px,6vw,48px)]">Ready to invite your <em className="text-[#ffe3ef]">favourite people?</em></h2>
            <p className="mt-2 opacity-90">Create your wedding website in minutes.</p>
            <LinkButton href="/register" variant="white" size="lg" className="mt-6">Create my website</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
