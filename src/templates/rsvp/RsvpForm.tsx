"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import type { SiteModel } from "@/lib/api/types";
import type { FormState } from "@/lib/forms";
import { RSVP_LABEL_DEFAULTS, type RsvpLabels } from "../content";
import "./rsvp.css";

/**
 * - live: the published site; replies go to the couple's guest list (`action` + `state` from useActionState).
 * - try: private preview and the template gallery; works like the real form, but nothing is sent.
 * - edit: the editor's live preview; looks exactly like the real form but can't be typed in (tapping it opens
 *   the RSVP settings).
 */
export type RsvpFormMode = "live" | "try" | "edit";

type Errors = Record<string, string[]>;

/** The same checks (and messages) as the server action, for the try-it form. */
function check(form: FormData): Errors {
  const errors: Errors = {};
  if (!String(form.get("fullName") ?? "").trim()) errors.fullName = ["Please enter your name."];
  if (!form.get("status")) errors.status = ["Please choose a response."];
  const email = String(form.get("email") ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ["Enter a valid email."];
  const phone = String(form.get("phone") ?? "").trim();
  if (phone && !/^\+?[0-9 ()-]{6,32}$/.test(phone)) errors.phone = ["Enter a valid phone number."];
  return errors;
}

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  return errors?.length ? <p id={id} className="olv-rsvp-error">{errors.join(" ")}</p> : null;
}

function Stepper({ label, max, value, onChange }: { label: string; max: number; value: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className="olv-rsvp-field olv-rsvp-wide">
      <span id={`${id}-label`} className="olv-rsvp-label">{label}</span>
      <div className="olv-rsvp-stepper" role="group" aria-labelledby={`${id}-label`}>
        <button type="button" className="olv-rsvp-step" aria-label="One fewer guest" disabled={value <= 0} onClick={() => onChange(value - 1)}>−</button>
        <output className="olv-rsvp-count" aria-live="polite">{value === 0 ? "Just me" : `Me + ${value}`}</output>
        <button type="button" className="olv-rsvp-step" aria-label="One more guest" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
      </div>
      <span className="olv-rsvp-hint">{max === 1 ? "You can bring one guest." : `You can bring up to ${max} guests.`}</span>
      <input type="hidden" name="plusOneCount" value={value} />
    </div>
  );
}

/**
 * The guest RSVP form, shared by every design so it looks the same in the editor, the previews and on the live
 * site. Styled by `rsvp.css` through the design's `--rsvp-*` variables (see docs/adding-templates.md).
 */
export function RsvpForm({ rsvp, labels = RSVP_LABEL_DEFAULTS, mode, action, state }: {
  rsvp: SiteModel["rsvp"]; labels?: RsvpLabels; mode: RsvpFormMode;
  action?: (form: FormData) => void; state?: FormState;
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState(state?.values?.status ?? "");
  const [guests, setGuests] = useState(() => Math.min(Number(state?.values?.plusOneCount ?? 0) || 0, rsvp.maxPlusOnes));
  const [tryErrors, setTryErrors] = useState<Errors | null>(null);
  const [tried, setTried] = useState(false);
  // Fields the guest has changed since the errors were shown: their error disappears straight away.
  const [fixed, setFixed] = useState<{ for: unknown; names: string[] }>({ for: null, names: [] });

  const shown: Errors = mode === "try" ? tryErrors ?? {} : state?.fieldErrors ?? {};
  const source = mode === "try" ? tryErrors : state;
  const fixedNames = fixed.for === source ? fixed.names : [];
  const errors: Errors = Object.fromEntries(Object.entries(shown).filter(([k]) => !fixedNames.includes(k)));
  const hasErrors = Object.keys(errors).length > 0;
  const message = mode === "try"
    ? (hasErrors ? "Please check the highlighted fields." : null)
    : state?.status === "error" && (hasErrors || !state.fieldErrors) ? state.message : null;
  const done = mode === "try" ? tried : state?.status === "success";
  const onFieldChange = (name: string) => {
    if (shown[name] && !fixedNames.includes(name)) setFixed({ for: source, names: [...fixedNames, name] });
  };

  // After a send with errors, move focus to the first field that needs attention (keyboard and screen-reader
  // users land on it). Only when a new set of errors arrives, never while the guest is fixing them.
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [source]);

  if (done) {
    return (
      <div className="olv-rsvp-root"><div className="olv-rsvp-thanks" role="status">
        <p className="olv-rsvp-thanks-title">{labels.thanks}</p>
        {mode === "try" ? (
          <>
            <p className="olv-rsvp-thanks-note">This is a preview, so your reply wasn&apos;t sent.</p>
            <button type="button" className="olv-rsvp-again" onClick={() => { setTried(false); setStatus(""); setGuests(0); }}>Try again</button>
          </>
        ) : null}
      </div></div>
    );
  }

  const onTry = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = check(new FormData(e.currentTarget));
    if (Object.keys(found).length) setTryErrors(found);
    else { setTryErrors(null); setTried(true); }
  };

  const options: [string, string][] = [
    ["attending", labels.accept], ["not_attending", labels.decline],
    ...(rsvp.allowUndecided ? [["undecided", labels.undecided] as [string, string]] : []),
  ];
  const id = (name: string) => `${uid}-${name}`;
  const invalid = (name: string) => (errors[name]?.length ? { "aria-invalid": true as const, "aria-describedby": id(`${name}-error`) } : {});
  const values = mode === "live" ? state?.values ?? {} : {};
  const disabled = mode === "edit";

  return (
    <div className="olv-rsvp-root">
    <form ref={formRef} className="olv-rsvp" data-mode={mode} noValidate
      onChange={(e) => { const name = (e.target as unknown as { name?: string }).name; if (name) onFieldChange(name); }}
      {...(mode === "live" ? { action } : { onSubmit: onTry })}
      {...(disabled ? { inert: true, "aria-hidden": true } : {})}>
      {message ? <p role="alert" className="olv-rsvp-alert">{message}</p> : null}

      <div className="olv-rsvp-field olv-rsvp-wide">
        <label htmlFor={id("name")} className="olv-rsvp-label">{labels.name}</label>
        <input id={id("name")} name="fullName" required autoComplete="name" defaultValue={values.fullName}
          className="olv-rsvp-input" tabIndex={disabled ? -1 : undefined} {...invalid("fullName")} />
        <FieldError id={id("fullName-error")} errors={errors.fullName} />
      </div>

      <fieldset className="olv-rsvp-field olv-rsvp-wide" {...(errors.status?.length ? { "aria-describedby": id("status-error") } : {})}>
        <legend className="olv-rsvp-label">{labels.attend}</legend>
        <div className="olv-rsvp-choices">
          {options.map(([value, label], i) => (
            <label key={value} className="olv-rsvp-choice">
              <input type="radio" name="status" value={value} checked={status === value} onChange={() => setStatus(value)}
                className="olv-rsvp-radio" tabIndex={disabled ? -1 : undefined} {...(i === 0 ? invalid("status") : {})} />
              <span className="olv-rsvp-dot" aria-hidden="true" />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <FieldError id={id("status-error")} errors={errors.status} />
      </fieldset>

      {status === "attending" && rsvp.maxPlusOnes > 0 ? (
        <Stepper label={labels.guests} max={rsvp.maxPlusOnes} value={guests} onChange={setGuests} />
      ) : <input type="hidden" name="plusOneCount" value="0" />}

      <div className="olv-rsvp-field">
        <label htmlFor={id("phone")} className="olv-rsvp-label">Phone <span className="olv-rsvp-optional">(optional)</span></label>
        <input id={id("phone")} name="phone" type="tel" autoComplete="tel" inputMode="tel" defaultValue={values.phone}
          className="olv-rsvp-input" tabIndex={disabled ? -1 : undefined} {...invalid("phone")} />
        <FieldError id={id("phone-error")} errors={errors.phone} />
      </div>
      <div className="olv-rsvp-field">
        <label htmlFor={id("email")} className="olv-rsvp-label">Email <span className="olv-rsvp-optional">(optional)</span></label>
        <input id={id("email")} name="email" type="email" autoComplete="email" inputMode="email" defaultValue={values.email}
          className="olv-rsvp-input" tabIndex={disabled ? -1 : undefined} {...invalid("email")} />
        <FieldError id={id("email-error")} errors={errors.email} />
      </div>

      {rsvp.collectMessage ? (
        <div className="olv-rsvp-field olv-rsvp-wide">
          <label htmlFor={id("message")} className="olv-rsvp-label">{labels.message} <span className="olv-rsvp-optional">(optional)</span></label>
          <textarea id={id("message")} name="message" rows={4} maxLength={1000} defaultValue={values.message}
            className="olv-rsvp-input olv-rsvp-textarea" tabIndex={disabled ? -1 : undefined} />
        </div>
      ) : null}

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="olv-rsvp-trap">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="olv-rsvp-wide">
        <Submit label={labels.submit} mode={mode} />
        <p className="olv-rsvp-privacy">{labels.privacy}</p>
      </div>
    </form>
    </div>
  );
}

/** Shows "Sending…" while a live reply is on its way (useFormStatus reads the enclosing form's Server Action). */
function Submit({ label, mode }: { label: string; mode: RsvpFormMode }) {
  const { pending } = useFormStatus();
  const busy = mode === "live" && pending;
  return (
    <button type="submit" className="olv-rsvp-submit" disabled={busy} tabIndex={mode === "edit" ? -1 : undefined}>
      {busy ? "Sending…" : label}
    </button>
  );
}
