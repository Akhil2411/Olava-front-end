"use client";

import { cn } from "@/lib/utils/cn";

/** Accessible on/off toggle (role="switch"). */
export function Switch({ checked, onChange, label, disabled, className, hideLabel }: {
  checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean; className?: string; hideLabel?: boolean;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      aria-label={hideLabel ? label : undefined}
      className={cn("inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50", className)}>
      <span aria-hidden="true" className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-pink-dark" : "bg-line")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]", checked ? "left-[18px]" : "left-0.5")} />
      </span>
      {hideLabel ? null : <span>{label}</span>}
    </button>
  );
}
