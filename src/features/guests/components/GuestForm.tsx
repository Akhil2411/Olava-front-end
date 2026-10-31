"use client";

import { useState, useTransition } from "react";
import { Alert, Button, Modal, SelectField, TextArea, TextField } from "@/components/ui";
import type { ApiProblem } from "@/lib/api/problem";
import type { Guest } from "@/lib/api/types";
import { saveGuestAction } from "../actions";

export function GuestForm({ weddingId, guest, open, onClose }: { weddingId: string; guest: Guest | null; open: boolean; onClose: () => void }) {
  const [problem, setProblem] = useState<ApiProblem | null>(null);
  const [status, setStatus] = useState<string>(guest?.rsvp?.status ?? "pending");
  const [pending, start] = useTransition();
  const fe = (f: string) => problem?.fieldErrors?.[f];

  const submit = (fd: FormData) => start(async () => {
    const fullName = String(fd.get("fullName") ?? "").trim();
    if (!fullName) {
      setProblem({ status: 400, code: "client.invalid", message: "Enter the guest's name.", fieldErrors: { fullName: ["Enter the guest's name."] } });
      return;
    }
    const result = await saveGuestAction(weddingId, guest?.id ?? null, {
      fullName, email: String(fd.get("email") ?? ""), phone: String(fd.get("phone") ?? ""), groupName: String(fd.get("groupName") ?? ""),
      maxPlusOnes: Number(fd.get("maxPlusOnes") ?? 0), notes: String(fd.get("notes") ?? ""),
      rsvpStatus: status, plusOneCount: Number(fd.get("plusOneCount") ?? 0), rsvpMessage: String(fd.get("rsvpMessage") ?? ""),
    });
    if (result.ok) { setProblem(null); onClose(); } else setProblem(result.error);
  });

  return (
    <Modal open={open} onClose={onClose} title={guest ? "Edit guest" : "Add guest"}>
      <form action={submit} className="space-y-4" noValidate>
        {problem ? <Alert tone="error">{problem.message}</Alert> : null}
        <TextField label="Full name" name="fullName" required defaultValue={guest?.fullName} errors={fe("fullName")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Email" name="email" type="email" defaultValue={guest?.email ?? ""} errors={fe("email")} />
          <TextField label="Phone" name="phone" type="tel" defaultValue={guest?.phone ?? ""} errors={fe("phone")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Group" name="groupName" defaultValue={guest?.groupName ?? ""} placeholder="Family, friends…" />
          <TextField label="Plus-ones allowed" name="maxPlusOnes" type="number" min={0} max={20} defaultValue={String(guest?.maxPlusOnes ?? 0)} errors={fe("maxPlusOnes")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="RSVP" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">No response yet</option>
            <option value="attending">Attending</option>
            <option value="not_attending">Not attending</option>
            <option value="undecided">Maybe</option>
          </SelectField>
          {status === "attending" ? (
            <TextField label="Plus-ones coming" name="plusOneCount" type="number" min={0} max={20} defaultValue={String(guest?.rsvp?.plusOneCount ?? 0)} errors={fe("plusOneCount")} />
          ) : null}
        </div>
        {status !== "pending" ? <TextArea label="Message" name="rsvpMessage" defaultValue={guest?.rsvp?.message ?? ""} maxLength={1000} rows={2} /> : null}
        <TextArea label="Private notes" name="notes" defaultValue={guest?.notes ?? ""} maxLength={1000} rows={2} hint="Only you can see these." />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending}>{guest ? "Save guest" : "Add guest"}</Button>
        </div>
      </form>
    </Modal>
  );
}
