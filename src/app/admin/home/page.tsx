import { getAdminTemplates, getHome, requireStaff } from "@/features/admin/data";
import { PageHeader } from "@/features/admin/components/ui";
import { HomeEditor } from "@/features/admin/components/HomeEditor";

export default async function AdminHomePage() {
  const [home, templates, staff] = await Promise.all([getHome(), getAdminTemplates(), requireStaff()]);
  return (
    <>
      <PageHeader title="Home page" description="Choose the templates the home page features, and the template the laptop, tablet and phone show at the top." />
      <HomeEditor home={home} templates={templates.filter((t) => t.status === "active")} isAdmin={staff.isAdmin} />
    </>
  );
}
