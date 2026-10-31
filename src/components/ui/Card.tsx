import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn("rounded-[22px] border border-line bg-white p-5 sm:p-6", className)} {...rest} />;
}

export function CardHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-mute">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
