import { getFaqs, requireStaff } from "@/features/admin/data";
import { PageHeader } from "@/features/admin/components/ui";
import { FaqManager } from "@/features/admin/components/FaqManager";

export default async function AdminFaqsPage() {
  const [faqs, staff] = await Promise.all([getFaqs(), requireStaff()]);
  return (
    <>
      <PageHeader title="FAQs" description="The questions and answers on the home page. Drag to reorder; unpublished ones are kept but not shown." />
      <FaqManager faqs={faqs} isAdmin={staff.isAdmin} />
    </>
  );
}
