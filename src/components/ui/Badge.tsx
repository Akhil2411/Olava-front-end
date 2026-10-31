import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "pink" | "neutral" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  pink: "bg-tint text-pink-deep",
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
};

export function Badge({ tone = "pink", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

const statusTone: Record<string, Tone> = { Draft: "neutral", Published: "success", Unpublished: "warning", Archived: "neutral" };

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? "neutral"}>{status === "Published" ? "Live" : status}</Badge>;
}
