import type { Metadata } from "next";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Terms of service" };

// PLACEHOLDER: legal text must be written and reviewed by the product owner / counsel (BRD §8, §9).
export default function Page() {
  return (
    <section className="wrap max-w-3xl py-16">
      <h1 className="text-5xl">Terms of service</h1>
      <Alert tone="warning" className="mt-6" title="Draft: needs legal review">
        This page is a placeholder. The final Terms of service, including data retention and deletion terms, has not been published yet.
      </Alert>
    </section>
  );
}
