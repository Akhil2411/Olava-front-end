"use client";

import { useLinkStatus } from "next/link";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { OlavaLoader } from "./OlavaLoader";
import { loaderStore } from "./loaderStore";

/** Place inside a <Link>: reports that link's pending navigation to the section loader. Renders nothing. */
export function TrackNavigation() {
  const { pending } = useLinkStatus();
  useEffect(() => {
    if (!pending) return;
    loaderStore.begin();
    return () => loaderStore.end();
  }, [pending]);
  return null;
}

export function useSectionLoading() {
  return useSyncExternalStore(loaderStore.subscribe, loaderStore.get, loaderStore.server);
}

/**
 * The content area of a wedding's dashboard. While a navigation to another section takes longer than
 * SHOW_DELAY, the themed loader covers this area (the header and section tabs stay in place, and the current
 * section keeps its size underneath, so nothing shifts). A polite live region announces it once.
 */
export function SectionContent({ children }: { children: ReactNode }) {
  const loading = useSectionLoading();
  return (
    <div className="relative min-h-[50vh]">
      <div aria-busy={loading || undefined} inert={loading || undefined}>{children}</div>
      <div role="status" aria-live="polite" className="sr-only">{loading ? "Loading section…" : ""}</div>
      {loading ? (
        <div aria-hidden="true" data-testid="section-loader"
          className="absolute inset-0 z-10 flex justify-center bg-blush pt-[min(16vh,140px)] [animation:olava-appear_160ms_ease-out]">
          <OlavaLoader className="h-fit" />
        </div>
      ) : null}
    </div>
  );
}

export function PendingLabel({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useLinkStatus();
  return <span className={cn(className, pending && "text-pink-dark")} data-pending={pending || undefined}>{children}</span>;
}
