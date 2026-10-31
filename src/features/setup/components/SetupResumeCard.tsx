"use client";

import { useTransition } from "react";
import { Button, LinkButton } from "@/components/ui";
import type { WeddingSetup } from "@/lib/api/types";
import { updateSetupAction } from "../actions";
import { labelOf, progressOf } from "../steps";

/** "Finish setting up": resumes the walkthrough where it was left (after leaving halfway or skipping). */
export function SetupResumeCard({ weddingId, setup, names }: { weddingId: string; setup: WeddingSetup; names?: string }) {
  const [pending, start] = useTransition();
  const { index, total } = progressOf(setup);
  return (
    <section aria-label="Finish setting up" className="rounded-[22px] border border-pink/40 bg-blush p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold">Finish setting up{names ? ` ${names}` : ""}</p>
          <p className="text-sm text-mute">Step {index} of {total}: {labelOf(setup.step ?? "sections")}. Your answers so far are saved.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" loading={pending} onClick={() => start(async () => { await updateSetupAction(weddingId, "dismissed", setup.step); })}>
            Dismiss
          </Button>
          <LinkButton href={`/dashboard/setup/${weddingId}`} size="sm">Continue</LinkButton>
        </div>
      </div>
    </section>
  );
}
