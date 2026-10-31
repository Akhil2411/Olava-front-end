import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Card, EmptyState, LinkButton, StatusBadge } from "@/components/ui";
import { redirect } from "next/navigation";
import { SetupResumeCard } from "@/features/setup/components/SetupResumeCard";
import { isOpenSetup } from "@/features/setup/steps";
import { getWeddings } from "@/features/weddings/data";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "My weddings" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const sp = await searchParams;
  const showArchived = sp.archived === "1";
  const weddings = await getWeddings(showArchived);
  // First visit (no wedding at all yet): straight into the walkthrough, unless they just skipped it or deleted one.
  if (weddings.length === 0 && !showArchived && !sp.setup && !sp.deleted && (await getWeddings(true)).length === 0) redirect("/dashboard/new");
  const unfinished = weddings.filter((w) => isOpenSetup(w.setup));

  return (
    <div className="wrap py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="text-5xl">My weddings</h1>
        </div>
        <LinkButton href="/dashboard/new">+ New wedding website</LinkButton>
      </div>
      {sp.deleted ? <Alert tone="success" className="mt-6">The wedding and its guest data were permanently deleted.</Alert> : null}
      {unfinished.length ? (
        <div className="mt-6 space-y-3">
          {unfinished.map((w) => <SetupResumeCard key={w.id} weddingId={w.id} setup={w.setup!} names={weddings.length > 1 ? `${w.partnerOneName} & ${w.partnerTwoName}` : undefined} />)}
        </div>
      ) : null}

      {weddings.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="💍" title="Create your first wedding website" action={<LinkButton href="/dashboard/new">Get started</LinkButton>}>
            Add your names and date, choose a design and preview it for free. Nothing is public until you publish.
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weddings.map((w) => (
            <li key={w.id}>
              <Link href={`/dashboard/weddings/${w.id}`} className="block h-full">
                <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-3xl">{w.partnerOneName} &amp; {w.partnerTwoName}</h2>
                    <StatusBadge status={w.status} />
                  </div>
                  <p className="mt-1 text-sm text-mute">{w.weddingDate ? formatDate(w.weddingDate) : "Date not set"}</p>
                  <p className="mt-3 text-sm">{w.template ? `Template: ${w.template.name}` : "No template chosen yet"}</p>
                  {w.status === "Published" && w.hasUnpublishedChanges ? <p className="mt-2 text-xs font-semibold text-warning">Unpublished changes</p> : null}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8 text-sm">
        <Link className="text-mute underline-offset-4 hover:underline" href={showArchived ? "/dashboard" : "/dashboard?archived=1"}>
          {showArchived ? "Hide archived weddings" : "Show archived weddings"}
        </Link>
      </p>
    </div>
  );
}
