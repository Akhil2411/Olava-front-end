import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[clamp(28px,4vw,40px)] leading-tight">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-mute">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function Panel({ title, description, action, children, className }: { title?: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-[20px] border border-line bg-white p-4 sm:p-5", className)}>
      {title || action ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title ? <h2 className="font-sans text-base font-semibold">{title}</h2> : null}
            {description ? <p className="text-sm text-mute">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mute">{label}</p>
      <p className="mt-1 font-serif text-[34px] leading-none text-ink">{value}</p>
      {hint ? <p className="mt-1.5 text-xs text-mute">{hint}</p> : null}
    </>
  );
  const cls = "block min-w-0 rounded-[20px] border border-line bg-white p-4 transition-colors";
  return href ? <Link href={href} className={cn(cls, "hover:border-pink/60 hover:bg-blush")}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** GET search/filter form: the URL holds the state, so results are linkable and Back works. */
export function FilterBar({ action, children }: { action: string; children: ReactNode }) {
  return (
    <form action={action} method="get" role="search" className="mb-4 flex flex-wrap items-end gap-2 rounded-[20px] border border-line bg-white p-3">
      {children}
      <button type="submit" className="h-11 rounded-full bg-pink-dark px-5 text-sm font-semibold text-white hover:bg-pink-deep">Apply</button>
    </form>
  );
}

export function FilterInput({ name, label, defaultValue, placeholder, className }: { name: string; label: string; defaultValue?: string; placeholder?: string; className?: string }) {
  return (
    <label className={cn("min-w-[12rem] flex-1 text-xs font-semibold text-mute", className)}>
      {label}
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} type="search"
        className="mt-1 block h-11 w-full rounded-full border border-line bg-white px-4 text-sm font-normal text-ink outline-none focus:border-pink-dark" />
    </label>
  );
}

export function FilterSelect({ name, label, defaultValue, options }: { name: string; label: string; defaultValue?: string; options: [string, string][] }) {
  return (
    <label className="text-xs font-semibold text-mute">
      {label}
      <select name={name} defaultValue={defaultValue ?? ""}
        className="mt-1 block h-11 rounded-full border border-line bg-white px-4 pr-8 text-sm font-normal text-ink outline-none focus:border-pink-dark">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

export function Pager({ page, pageSize, total, href }: { page: number; pageSize: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return <p className="mt-3 text-xs text-mute">{total} {total === 1 ? "result" : "results"}</p>;
  return (
    <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="text-mute">Page {page} of {pages} · {total} results</span>
      <span className="flex gap-2">
        {page > 1 ? <Link className="rounded-full border border-line bg-white px-4 py-2 font-medium hover:bg-tint" href={href(page - 1)}>← Previous</Link> : null}
        {page < pages ? <Link className="rounded-full border border-line bg-white px-4 py-2 font-medium hover:bg-tint" href={href(page + 1)}>Next →</Link> : null}
      </span>
    </nav>
  );
}

/** A responsive table: real table on wide screens; each row becomes a card on phones (cells carry data-label). */
export function DataTable({ head, children, empty }: { head: string[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-white">
      <table className="admin-table w-full text-left text-sm">
        <thead className="hidden bg-blush text-xs uppercase tracking-[0.1em] text-mute md:table-header-group">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <td data-label={label} className={cn("px-4 py-3 align-top", className)}>{children}</td>;
}

export const bytes = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} B`;
export const when = (iso: string | null | undefined) => iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—";
export const whenTime = (iso: string | null | undefined) => iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) : "—";
