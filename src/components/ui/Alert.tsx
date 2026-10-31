import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "info" | "success" | "warning" | "error";

const tones: Record<Tone, string> = {
  info: "bg-tint text-ink border-line",
  success: "bg-success-tint text-success border-success/20",
  warning: "bg-warning-tint text-warning border-warning/20",
  error: "bg-danger-tint text-danger border-danger/20",
};

export function Alert({ tone = "info", title, children, className, action }: {
  tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string; action?: ReactNode;
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-2xl border px-4 py-3 text-sm", tones[tone], className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          {title ? <p className="font-semibold">{title}</p> : null}
          {children ? <div>{children}</div> : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export function FormMessage({ state }: { state: { status: string; message?: string } }) {
  if (state.status === "idle" || !state.message) return null;
  return <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>;
}
