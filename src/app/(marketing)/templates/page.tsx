import type { Metadata } from "next";
import { Alert } from "@/components/ui";
import { getTemplates } from "@/features/catalog/data";
import { parseFilter } from "@/features/catalog/filters";
import { TemplateGallery } from "@/features/catalog/TemplateGallery";

export const metadata: Metadata = { title: "Templates", description: "Browse Olava's wedding website templates and preview them on any device." };

export default async function TemplatesPage({ searchParams }: PageProps<"/templates">) {
  const [templates, params] = await Promise.all([getTemplates(), searchParams]);
  return (
    <section className="bg-[radial-gradient(circle_at_50%_0,#fde3ee,transparent_65%)] pb-20 pt-12">
      <div className="wrap">
        <div className="text-center">
          <p className="eyebrow">Template gallery</p>
          <h1 className="text-[clamp(36px,7vw,56px)]">Choose your <em className="text-pink-dark">design</em></h1>
          <p className="mx-auto mt-3 max-w-xl text-mute">Tap “Live preview” to see any design on mobile, tablet and desktop. You can switch templates later without losing your details.</p>
        </div>
        {templates.length === 0 ? (
          <Alert tone="warning" className="mx-auto mt-10 max-w-lg">Templates couldn&apos;t be loaded right now. Please refresh in a moment.</Alert>
        ) : (
          <TemplateGallery templates={templates} initialFilter={parseFilter(templates, params)} />
        )}
      </div>
    </section>
  );
}
