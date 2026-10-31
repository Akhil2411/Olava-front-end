"use client";
import type React from "react";

import { useBrowserValue } from "@/lib/utils/client";

function daysUntil(weddingDate: string): number {
  const [y, m, d] = weddingDate.split("-").map(Number);
  const today = new Date();
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - start) / 86_400_000);
}

/**
 * Days until the wedding date (date-only, so no time-zone surprises). Hidden once the day has passed.
 * `preview` keeps it visible in the editor even when there is no date yet.
 */
export function CountdownNumber({ weddingDate, daysLabel, dayLabel, todayText, preview = false }: {
  weddingDate: string | null; daysLabel: string; dayLabel: string; todayText: string; preview?: boolean;
}) {
  // Computed in the browser (the visitor's "today"); nothing renders on the server, so no hydration mismatch.
  const days = useBrowserValue(() => (weddingDate ? daysUntil(weddingDate) : null), null);
  if (days === null || days < 0) {
    return preview ? <p className="mt-3 text-sm text-[var(--s-muted)]">{weddingDate ? "…" : "Add your wedding date to start the countdown."}</p> : null;
  }
  return (
    <>
      <p className="mt-3 font-[family-name:var(--s-heading)] text-6xl text-[var(--s-accent)]">{days === 0 ? todayText : days}</p>
      {days > 0 ? <p className="text-sm text-[var(--s-muted)]">{days === 1 ? dayLabel : daysLabel}</p> : null}
    </>
  );
}

/** Renders its children only while the wedding is today or in the future (always in the editor). */
export function CountdownGate({ weddingDate, always, children }: { weddingDate: string | null; always: boolean; children: React.ReactNode }) {
  const days = useBrowserValue(() => (weddingDate ? daysUntil(weddingDate) : null), null);
  if (always) return <>{children}</>;
  return days === null || days < 0 ? null : <>{children}</>;
}
