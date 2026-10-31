"use client";

import { useState, useTransition } from "react";
import { Alert, Button, Card, CardHeader, ConfirmDialog } from "@/components/ui";
import type { Wedding } from "@/lib/api/types";
import { archiveWeddingAction, deleteWeddingAction } from "../actions";

export function DangerZone({ wedding }: { wedding: Wedding }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const archived = wedding.status === "Archived";

  return (
    <div className="max-w-3xl space-y-6">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Card>
        <CardHeader title={archived ? "Restore wedding" : "Archive wedding"}
          description={archived ? "Bring this wedding back to your dashboard and continue editing." : "Hide it from your dashboard without deleting anything. Unpublish it first if it's live."} />
        <Button variant="secondary" loading={pending} disabled={!archived && wedding.status === "Published"}
          onClick={() => start(async () => { const r = await archiveWeddingAction(wedding.id, !archived); setError(r.ok ? null : r.error.message); })}>
          {archived ? "Restore" : "Archive"}
        </Button>
      </Card>
      <Card className="border-danger/30">
        <CardHeader title="Delete wedding and personal data"
          description="Permanently deletes this website, its guest list, RSVPs and photos. Payment records are kept for accounting without your guest data. This can't be undone." />
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete permanently</Button>
      </Card>
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this wedding forever?" confirmLabel="Delete everything"
        requireText={wedding.slug} busy={pending}
        onConfirm={() => start(async () => {
          const result = await deleteWeddingAction(wedding.id, wedding.slug);
          if (!result.ok) { setError(result.error.message); setConfirmDelete(false); }
        })}>
        <p>The website, {wedding.status === "Published" ? "which is currently live, " : ""}guest list, RSVPs and all photos will be permanently removed.</p>
      </ConfirmDialog>
    </div>
  );
}
