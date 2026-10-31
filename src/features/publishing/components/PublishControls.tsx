"use client";

import { useState, useTransition } from "react";
import { Alert, Button, ConfirmDialog } from "@/components/ui";
import type { PublishingStatus } from "@/lib/api/types";
import { publishAction, unpublishAction } from "../actions";

/** Publish / republish / unpublish. The button is a convenience only; the API enforces every rule. */
export function PublishControls({ weddingId, status }: { weddingId: string; status: PublishingStatus }) {
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [pending, start] = useTransition();
  const live = status.status === "Published";

  const publish = () => start(async () => {
    const result = await publishAction(weddingId);
    setMessage(result.ok
      ? { tone: "success", text: live ? "Republished: guests now see your latest changes." : "Your website is live!" }
      : { tone: "error", text: result.error.message });
  });

  const unpublish = () => start(async () => {
    const result = await unpublishAction(weddingId);
    setConfirmUnpublish(false);
    setMessage(result.ok ? { tone: "success", text: "Your website is offline. Your link now shows a 'not available' page." } : { tone: "error", text: result.error.message });
  });

  return (
    <div className="space-y-3">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        {(!live || status.hasUnpublishedChanges) ? (
          <Button size="lg" onClick={publish} loading={pending} disabled={!status.canPublish}>
            {live ? "Republish changes" : "Publish website"}
          </Button>
        ) : null}
        {live ? <Button variant="secondary" onClick={() => setConfirmUnpublish(true)} disabled={pending}>Unpublish</Button> : null}
      </div>
      <ConfirmDialog open={confirmUnpublish} onClose={() => setConfirmUnpublish(false)} onConfirm={unpublish} busy={pending}
        title="Take your website offline?" confirmLabel="Unpublish">
        <p>Guests opening your link or QR code will see a &ldquo;not available&rdquo; page until you publish again. Your draft, guests and photos are kept.</p>
      </ConfirmDialog>
    </div>
  );
}
