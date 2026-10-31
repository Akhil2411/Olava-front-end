import { getAdminTemplates, getDesigns, getTiers, requireStaff } from "@/features/admin/data";
import { PageHeader } from "@/features/admin/components/ui";
import { TemplateManager } from "@/features/admin/components/TemplateManager";

export default async function AdminTemplatesPage() {
  const [templates, designs, tiers, staff] = await Promise.all([getAdminTemplates(), getDesigns(), getTiers(), requireStaff()]);
  return (
    <>
      <PageHeader title="Templates" description="The designs couples choose from, in the order shown here. Drag to reorder. Hidden templates aren't offered any more but keep working for weddings that use them." />
      <TemplateManager templates={templates} designs={designs} tiers={tiers} isAdmin={staff.isAdmin} />
    </>
  );
}
