"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const control =
  "w-full rounded-[14px] border-[1.5px] border-transparent bg-tint px-4 py-3 text-[15px] text-ink outline-none " +
  "placeholder:text-mute/70 focus:border-pink-dark focus:bg-white aria-[invalid=true]:border-danger disabled:opacity-60";

interface FieldShellProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  errors?: string[];
  required?: boolean;
  children: ReactNode;
  className?: string;
  /** Shown beside the label, outside it (e.g. a help button), so it doesn't move focus to the field. */
  labelAction?: ReactNode;
}

function FieldShell({ id, label, hint, errors, required, children, className, labelAction }: FieldShellProps) {
  const labelEl = (
    <label htmlFor={id} className="block text-sm font-semibold text-ink">
      {label}
      {required ? <span className="text-danger" aria-hidden="true"> *</span> : null}
    </label>
  );
  return (
    <div className={cn("space-y-1.5", className)}>
      {labelAction ? <div className="flex items-center gap-1.5">{labelEl}{labelAction}</div> : labelEl}
      {children}
      {hint && !errors?.length ? <p id={`${id}-hint`} className="text-xs text-mute">{hint}</p> : null}
      {errors?.length ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">{errors.join(" ")}</p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, hint?: ReactNode, errors?: string[]) {
  if (errors?.length) return `${id}-error`;
  return hint ? `${id}-hint` : undefined;
}

type Common = { label: ReactNode; hint?: ReactNode; errors?: string[]; wrapperClassName?: string; labelAction?: ReactNode };

/**
 * A field's error stays until the person edits that field, then goes away (a new submit can bring it back).
 * Errors are compared by identity: each submit returns new error arrays.
 */
function useEditableErrors(errors: string[] | undefined) {
  const [editedAway, setEditedAway] = useState<string[] | undefined>();
  const shown = errors?.length && errors !== editedAway ? errors : undefined;
  const onEdit = () => { if (shown) setEditedAway(errors); };
  return { shown, onEdit };
}

export function TextField({ label, hint, errors, wrapperClassName, labelAction, id, className, type, onInput, ...rest }: Common & ComponentProps<"input">) {
  const auto = useId();
  const fieldId = id ?? auto;
  const { shown, onEdit } = useEditableErrors(errors);
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const input = (
    <input
      id={fieldId}
      type={isPassword && visible ? "text" : type}
      className={cn(control, isPassword && "pr-12", className)}
      aria-invalid={shown ? true : undefined}
      aria-describedby={describedBy(fieldId, hint, shown)}
      onInput={(e) => { onEdit(); onInput?.(e); }}
      {...rest}
    />
  );
  return (
    <FieldShell id={fieldId} label={label} hint={hint} errors={shown} required={rest.required} className={wrapperClassName} labelAction={labelAction}>
      {isPassword ? (
        <div className="relative">
          {input}
          {/* Show / hide what's been typed. */}
          <button type="button" onClick={() => setVisible((v) => !v)} aria-pressed={visible} aria-controls={fieldId}
            aria-label={visible ? "Hide password" : "Show password"} title={visible ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-1.5 my-auto flex size-9 items-center justify-center rounded-full text-mute hover:bg-white/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-pink-dark">
            <EyeIcon off={visible} />
          </button>
        </div>
      ) : input}
    </FieldShell>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M3 3l18 18" /> : null}
    </svg>
  );
}

export function TextArea({ label, hint, errors, wrapperClassName, id, className, onInput, ...rest }: Common & ComponentProps<"textarea">) {
  const auto = useId();
  const fieldId = id ?? auto;
  const { shown, onEdit } = useEditableErrors(errors);
  return (
    <FieldShell id={fieldId} label={label} hint={hint} errors={shown} required={rest.required} className={wrapperClassName}>
      <textarea
        id={fieldId}
        className={cn(control, "min-h-28 resize-y", className)}
        aria-invalid={shown ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, shown)}
        onInput={(e) => { onEdit(); onInput?.(e); }}
        {...rest}
      />
    </FieldShell>
  );
}

export function SelectField({ label, hint, errors, wrapperClassName, id, className, children, ...rest }: Common & ComponentProps<"select">) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} errors={errors} required={rest.required} className={wrapperClassName}>
      <select
        id={fieldId}
        className={cn(control, "appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10", className)}
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236f5b65'%3E%3Cpath d='M5.5 7.5l4.5 4.5 4.5-4.5'/%3E%3C/svg%3E\")" }}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, errors)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function Checkbox({ label, hint, id, className, ...rest }: { label: ReactNode; hint?: ReactNode } & ComponentProps<"input">) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input id={fieldId} type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-pink-dark" aria-describedby={hint ? `${fieldId}-hint` : undefined} {...rest} />
      <div className="min-w-0">
        <label htmlFor={fieldId} className="block text-sm leading-5 font-medium text-ink">{label}</label>
        {hint ? <p id={`${fieldId}-hint`} className="mt-1 text-xs leading-[1.125rem] text-mute">{hint}</p> : null}
      </div>
    </div>
  );
}
