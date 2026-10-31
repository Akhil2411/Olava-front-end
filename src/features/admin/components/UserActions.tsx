"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Button, Checkbox, ConfirmDialog, Modal, TextArea } from "@/components/ui";
import { blockUserSitesAction, deleteUserAction, reactivateUserAction, setRolesAction, suspendUserAction } from "../actions";
import type { AdminUserListItem } from "../types";

const ROLE_LABELS: Record<string, [string, string]> = {
  PlatformAdmin: ["Admin", "Everything, including granting, extending and cancelling packages, deleting accounts, prices, templates and settings."],
  Support: ["Support", "Can see everything, suspend or reactivate users and take sites offline or restore them."],
};

/** Suspend / reactivate, roles, take sites offline and delete, each confirmed first. */
export function UserActions({ user, isAdmin, assignableRoles }: { user: AdminUserListItem; isAdmin: boolean; assignableRoles: string[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "suspend" | "roles" | "delete" | "offline">(null);
  const [reason, setReason] = useState("");
  const [roles, setRoles] = useState<string[]>(user.roles);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const close = () => { setDialog(null); setReason(""); setError(null); };
  const run = (fn: () => Promise<{ ok: boolean; error?: { message: string } }>, after?: () => void) => start(async () => {
    const r = await fn();
    if (r.ok) { close(); after?.(); router.refresh(); } else setError(r.error?.message ?? "Something went wrong.");
  });

  return (
    <>
      {notice ? <p className="w-full text-sm text-success" role="status">{notice}</p> : null}
      {user.status === "active"
        ? <Button size="sm" variant="secondary" onClick={() => setDialog("suspend")}>Suspend</Button>
        : <Button size="sm" variant="secondary" loading={pending} onClick={() => run(() => reactivateUserAction(user.id), () => setNotice("Reactivated: they can sign in again."))}>Reactivate</Button>}
      {isAdmin ? <Button size="sm" variant="secondary" onClick={() => setDialog("offline")}>Take sites offline</Button> : null}
      {isAdmin ? <Button size="sm" variant="secondary" onClick={() => { setRoles(user.roles); setDialog("roles"); }}>Change role</Button> : null}
      {isAdmin ? <Button size="sm" variant="danger" onClick={() => setDialog("delete")}>Delete</Button> : null}

      <ConfirmDialog open={dialog === "suspend"} onClose={close} busy={pending} title={`Suspend ${user.name || user.email}?`} confirmLabel="Suspend account"
        onConfirm={() => run(() => suspendUserAction(user.id, reason), () => setNotice("Suspended and signed out everywhere."))}>
        <p>They&apos;ll be signed out everywhere and can&apos;t sign in until you reactivate them. Their published wedding sites stay online.</p>
        <TextArea label="Reason (kept in the activity log)" value={reason} maxLength={500} rows={2} onChange={(e) => setReason(e.target.value)} />
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>

      <ConfirmDialog open={dialog === "offline"} onClose={close} busy={pending} title="Take all their sites offline?" confirmLabel="Take offline"
        onConfirm={() => run(() => blockUserSitesAction(user.id, reason), () => setNotice("Their sites are offline. Restore them one by one in Wedding sites."))}>
        <p>Guests will see &quot;unavailable&quot; and the couple can&apos;t republish until you restore each site (Wedding sites).</p>
        <TextArea label="Reason (kept in the activity log)" value={reason} required maxLength={500} rows={2} onChange={(e) => setReason(e.target.value)} />
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>

      <Modal open={dialog === "roles"} onClose={close} title="Change role">
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm text-mute">Staff roles give access to this admin panel. No role = a normal customer.</legend>
          {assignableRoles.map((r) => (
            <Checkbox key={r} label={<><b>{ROLE_LABELS[r]?.[0] ?? r}</b><span className="block text-xs text-mute">{ROLE_LABELS[r]?.[1]}</span></>}
              checked={roles.includes(r)} onChange={(e) => setRoles((xs) => e.target.checked ? [...xs, r] : xs.filter((x) => x !== r))} />
          ))}
        </fieldset>
        {error ? <Alert tone="error" className="mt-4">{error}</Alert> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button loading={pending} onClick={() => run(() => setRolesAction(user.id, roles), () => setNotice("Roles saved. It takes effect right away."))}>Save roles</Button>
        </div>
      </Modal>

      <ConfirmDialog open={dialog === "delete"} onClose={close} busy={pending} requireText={user.email} confirmLabel="Delete permanently"
        title={`Delete ${user.name || user.email}?`}
        onConfirm={() => run(() => deleteUserAction(user.id, user.email), () => router.push("/admin/users"))}>
        <p className="font-semibold text-danger">This can&apos;t be undone.</p>
        <p>The account, its {user.weddings} wedding{user.weddings === 1 ? "" : "s"} (and live sites), guests, RSVPs and uploaded photos are deleted.
          Orders and payments are kept for your accounts, without their name.</p>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}
