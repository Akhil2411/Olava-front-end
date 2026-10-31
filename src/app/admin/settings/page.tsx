import { getSiteInfo, getSwitches, requireStaff } from "@/features/admin/data";
import { PageHeader } from "@/features/admin/components/ui";
import { SettingsEditor } from "@/features/admin/components/SettingsEditor";

export default async function AdminSettingsPage() {
  const [site, switches, staff] = await Promise.all([getSiteInfo(), getSwitches(), requireStaff()]);
  return (
    <>
      <PageHeader title="Settings" description="Site details shown in the footer, and switches for sign-ups, sign-in and email." />
      <SettingsEditor site={site} switches={switches} isAdmin={staff.isAdmin} />
    </>
  );
}
