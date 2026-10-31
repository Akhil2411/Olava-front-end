import type { ReactNode } from "react";

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[22px] border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      {icon ? <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-tint text-2xl" aria-hidden="true">{icon}</div> : null}
      <h3 className="text-2xl">{title}</h3>
      {children ? <div className="mt-2 max-w-md text-sm text-mute">{children}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
