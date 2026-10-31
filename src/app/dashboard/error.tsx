"use client";

import { Alert, Button } from "@/components/ui";

/** Unexpected errors in the dashboard. Unsaved form state in other tabs is unaffected. */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap py-10">
      <Alert tone="error" title="Something went wrong" action={<Button size="sm" onClick={reset}>Try again</Button>}>
        {error.message || "Please try again in a moment."}
      </Alert>
    </div>
  );
}
