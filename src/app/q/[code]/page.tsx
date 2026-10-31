import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Unavailable } from "@/features/public/Unavailable";
import { api } from "@/lib/api/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Stable QR destination. The short code never changes, so printed QR codes stay valid through edits and
 * republishing. It only ever redirects to the same wedding's live site; otherwise a neutral page is shown.
 */
export default async function QrRedirectPage({ params }: PageProps<"/q/[code]">) {
  const { code } = await params;
  if (!/^[a-z0-9]{4,16}$/i.test(code)) return <Unavailable />;
  const result = await api<{ slug: string; publicUrl: string }>(`/api/v1/public/resolve/${code}`, { auth: false });
  if (result.ok) redirect(result.data.publicUrl);
  return <Unavailable ended={!result.ok && result.problem.status === 410} />;
}
