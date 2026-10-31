"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./Button";

/** Submit button that shows a spinner and disables itself while its form's Server Action runs. */
export function SubmitButton({ pendingLabel, pending: busy, children, ...rest }: ButtonProps & { pendingLabel?: string; pending?: boolean }) {
  // `pending` covers forms submitted with useKeepValuesSubmit, which useFormStatus can't see.
  const pending = useFormStatus().pending || Boolean(busy);
  return (
    <Button type="submit" loading={pending} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
