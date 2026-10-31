"use client";

import { startTransition, type FormEvent } from "react";

/**
 * React clears a form after its action runs, so a failed submit would wipe what was typed (passwords are never
 * echoed back from the server). Submitting through this handler runs the same action without that reset. Without
 * JavaScript the form still posts to its action normally.
 */
export function useKeepValuesSubmit(action: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}
