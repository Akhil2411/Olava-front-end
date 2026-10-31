import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui";
import { getTemplates } from "@/features/catalog/data";
import { DEFAULT_SELECTION, stepsFor } from "@/features/setup/steps";
import { CreateWeddingForm } from "@/features/weddings/components/CreateWeddingForm";

export const metadata: Metadata = { title: "New wedding website" };

export default async function NewWeddingPage({ searchParams }: PageProps<"/dashboard/new">) {
  const sp = await searchParams;
  const templates = await getTemplates();
  // From the template gallery ("Use this template"): preselected on the design step.
  const initial = typeof sp.template === "string" && templates.some((t) => t.key === sp.template) ? sp.template : undefined;
  const total = stepsFor(DEFAULT_SELECTION).length;
  return (
    <div className="wrap max-w-2xl py-8">
      <Link href="/dashboard" className="text-sm text-mute hover:text-ink">← My weddings</Link>
      <p className="eyebrow mt-6">Step 1 of {total}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-tint" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={total} aria-valuenow={1}>
        <div className="h-full rounded-full bg-pink-dark" style={{ width: `${100 / total}%` }} />
      </div>
      <h1 className="mt-6 text-5xl">Let&apos;s start with the two of you</h1>
      <p className="mt-2 text-mute">Next you&apos;ll choose a design and what your website includes, then fill in a few short forms. Everything can be changed later.</p>
      <Card className="mt-8">
        <CreateWeddingForm initialTemplate={initial} />
        <div className="mt-6 border-t border-line pt-5">
          <Link href="/dashboard?setup=skipped" className="text-sm font-medium text-mute underline-offset-4 hover:text-ink hover:underline">Skip this for now</Link>
        </div>
      </Card>
    </div>
  );
}
