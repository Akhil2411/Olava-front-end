import Link from "next/link";
import { Alert, Badge, Card, CardHeader } from "@/components/ui";
import { CheckoutButton } from "@/features/billing/components/CheckoutButton";
import { PublishControls } from "@/features/publishing/components/PublishControls";
import { ShareButtons } from "@/features/sharing/ShareButtons";
import { getOrders, getPreview, getPublishing, getQuote, getShare, getWedding } from "@/features/weddings/data";
import { SAMPLE_SECTION_NAMES, sampleSections } from "@/templates/samples";
import type { PublishBlocker } from "@/lib/api/types";
import { formatDate, formatInstant, formatMoney } from "@/lib/utils/format";

const BLOCKERS: Record<PublishBlocker, { text: string; tab?: string }> = {
  archived: { text: "This wedding is archived.", tab: "settings" },
  template_missing: { text: "Choose a template.", tab: "design" },
  wedding_date_missing: { text: "Add your wedding date.", tab: "details" },
  events_missing: { text: "Add at least one visible event.", tab: "events" },
  payment_required: { text: "Choose your package below." },
  upgrade_required: { text: "Your template needs a higher package. Upgrade below (you only pay the difference)." },
  entitlement_expired: { text: "Your website's live period has ended. Extensions are coming soon." },
  blocked_by_admin: { text: "Our team has taken this website offline. Please contact us to restore it." },
};

const ORDER_TONE = { Paid: "success", Pending: "warning", Failed: "danger", Cancelled: "neutral", Refunded: "neutral" } as const;

export default async function PublishPage({ params }: PageProps<"/dashboard/weddings/[id]/publish">) {
  const { id } = await params;
  const [wedding, status, quote, orders, share, preview] = await Promise.all([
    getWedding(id), getPublishing(id), getQuote(id), getOrders(id), getShare(id), getPreview(id),
  ]);
  const blockers = status.blockers;
  // Sections that still show sample content in the editor: explained here so publishing holds no surprises.
  const samples = preview.ok ? sampleSections(preview.data).filter((s) => s.id) : [];
  const base = `/dashboard/weddings/${id}`;
  const shareData = share.ok ? share.data : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader title={status.status === "Published" ? "Your website is live" : "Publish your website"}
            description={status.status === "Published"
              ? `Last published ${formatInstant(status.publishedAt)}.`
              : "Your draft is private until you publish. Publishing needs a one-time package for this wedding."} />
          {blockers.length > 0 ? (
            <Alert tone="warning" title="Before you can publish" className="mb-4">
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {blockers.map((b) => (
                  <li key={b}>{BLOCKERS[b]?.tab ? <Link className="underline" href={`${base}/${BLOCKERS[b].tab}`}>{BLOCKERS[b].text}</Link> : BLOCKERS[b]?.text ?? b}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
          {samples.length > 0 ? (
            <Alert tone="info" title="Some sections still show sample content" className="mb-4">
              <p>These sections are empty, so they show sample content in the editor and won&apos;t appear on your live site until you add your own:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {samples.map((s) => (
                  <li key={s.id}>
                    <Link className="inline-flex rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold text-pink-dark hover:bg-tint"
                      href={`${base}/design?section=${s.id}`}>{SAMPLE_SECTION_NAMES[s.key] ?? s.key}</Link>
                  </li>
                ))}
              </ul>
            </Alert>
          ) : null}
          {status.status === "Published" && status.hasUnpublishedChanges ? (
            <Alert tone="info" className="mb-4">You have changes that aren&apos;t live yet. <Link className="underline" href={`${base}/preview`}>Preview them</Link>, then republish.</Alert>
          ) : null}
          <PublishControls weddingId={id} status={status} />
          {status.entitlement ? (
            <p className="mt-4 text-sm text-mute">
              {status.entitlement.tierName} package · online until <strong>{formatDate(status.entitlement.liveUntil)}</strong>
              {status.entitlement.isExpired ? " (ended)" : ""}
            </p>
          ) : null}
        </Card>

        <Card>
          <CardHeader title="Package" description="Pay once per wedding. Designing and previewing are always free." />
          {!quote.ok ? (
            <Alert tone={quote.problem.code === "wedding.no_template" ? "info" : "error"}>
              {quote.problem.code === "wedding.no_template" ? <>Choose a <Link className="underline" href={`${base}/design`}>template</Link> to see its package.</> : quote.problem.message}
            </Alert>
          ) : quote.data.kind === "none" ? (
            <Alert tone="success" title={`${quote.data.currentTier?.name ?? quote.data.requiredTier.name} package active`}>
              Your current template ({quote.data.templateName}) is covered. Nothing more to pay.
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-blush p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-3xl">{quote.data.requiredTier.name}</h3>
                  <p className="font-serif text-4xl text-pink-dark">{formatMoney(quote.data.amountDueMinor, quote.data.currency)}</p>
                </div>
                <p className="text-sm text-mute">
                  {quote.data.kind === "upgrade"
                    ? `Upgrade for ${quote.data.templateName}: ${formatMoney(quote.data.requiredTier.priceMinor, quote.data.currency)} minus the ${formatMoney(quote.data.creditMinor, quote.data.currency)} you've already paid.`
                    : `Required for ${quote.data.templateName}. One-time payment for this wedding.`}
                </p>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {quote.data.requiredTier.features.map((f) => <li key={f} className="flex gap-2"><span aria-hidden="true" className="text-success">✓</span>{f}</li>)}
                </ul>
              </div>
              {quote.data.paymentsConfigured ? (
                <CheckoutButton weddingId={id} amountMinor={quote.data.amountDueMinor} currency={quote.data.currency}
                  label={quote.data.kind === "upgrade" ? "Upgrade" : "Pay & unlock publishing"} />
              ) : (
                <Alert tone="warning">Online payment isn&apos;t configured on this server yet (Razorpay test keys are missing).</Alert>
              )}
            </div>
          )}
        </Card>

        {orders.length > 0 ? (
          <Card>
            <CardHeader title="Purchases" />
            <ul className="divide-y divide-line text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-mute">{formatInstant(o.createdAt)}{o.failureReason && o.status !== "Paid" ? ` · ${o.failureReason}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{formatMoney(o.amountMinor, o.currency)}</span>
                    <Badge tone={ORDER_TONE[o.status]}>{o.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      <Card className="h-fit">
        <CardHeader title="Share" description="Your link and QR code never change, even when you edit and republish." />
        {shareData ? (
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-sm font-semibold">Your website</p>
              <a href={shareData.publicUrl} target="_blank" rel="noopener noreferrer" className="break-all text-pink-dark underline">{shareData.publicUrl}</a>
            </div>
            <ShareButtons url={shareData.publicUrl} text={shareData.shareText} whatsAppUrl={shareData.whatsAppUrl} />
            <div className="rounded-2xl border border-line p-4 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/weddings/${id}/qr?format=svg`} alt={`QR code that opens ${shareData.publicUrl}`} className="mx-auto h-48 w-48" />
              <p className="mt-2 text-xs text-mute">Opens {shareData.qrTargetUrl}, which always leads to your website.</p>
              <div className="mt-3 flex justify-center gap-2 text-sm">
                <a className="rounded-full border-[1.5px] border-pink-dark px-4 py-2 font-semibold text-pink-dark hover:bg-tint" href={`/api/weddings/${id}/qr?format=png`} download>Download PNG</a>
                <a className="rounded-full border-[1.5px] border-pink-dark px-4 py-2 font-semibold text-pink-dark hover:bg-tint" href={`/api/weddings/${id}/qr?format=svg`} download>SVG (for print)</a>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-mute">
            {wedding.status === "Published" ? "Sharing is unavailable right now." : "Publish your website to get your link, WhatsApp sharing and a QR code. Drafts can't be shared."}
          </p>
        )}
      </Card>
    </div>
  );
}
