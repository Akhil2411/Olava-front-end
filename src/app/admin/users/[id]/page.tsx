import Link from "next/link";
import { Badge, StatusBadge } from "@/components/ui";
import { getTiers, getUser, requireStaff } from "@/features/admin/data";
import { DataTable, PageHeader, Panel, Stat, Td, bytes, when, whenTime } from "@/features/admin/components/ui";
import { UserActions } from "@/features/admin/components/UserActions";
import { PackageActions } from "@/features/admin/components/PackageActions";
import { isId } from "@/lib/api/loaders";
import { formatMoney } from "@/lib/utils/format";
import { notFound } from "next/navigation";
import { describe } from "@/features/admin/activity";

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  if (!isId(id)) notFound();
  const [d, staff, tiers] = await Promise.all([getUser(id), requireStaff(), getTiers()]);
  const u = d.user;
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/users" className="text-mute hover:text-ink">← Users</Link></p>
      <PageHeader title={u.name || u.email}
        description={<>{u.email} · joined {when(u.createdAt)} · signs in with {[d.hasPassword && "password", d.hasGoogle && "Google"].filter(Boolean).join(" and ") || "—"}</>}
        action={<UserActions user={u} isAdmin={staff.isAdmin} assignableRoles={staff.assignableRoles} />} />
      {u.status === "suspended" ? (
        <div className="mb-6 rounded-[20px] border border-danger/30 bg-danger-tint p-4 text-sm text-danger" role="status">
          <b>Suspended.</b> They can&apos;t sign in{d.suspendedReason ? `. Reason: ${d.suspendedReason}` : ""}. Their published sites stay online unless you take them offline.
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Weddings" value={u.weddings} hint={`${u.liveSites} live`} />
        <Stat label="Package" value={<span className="text-2xl">{u.package ?? "None"}</span>} />
        <Stat label="Paid" value={<span className="text-2xl">{u.paidMinor ? formatMoney(u.paidMinor) : "—"}</span>} />
        <Stat label="Storage" value={<span className="text-2xl">{bytes(d.storageBytes)}</span>} hint={<Link className="underline" href={`/admin/sites?q=${encodeURIComponent(u.email)}`}>Their sites</Link>} />
      </div>

      <Panel title="Weddings" className="mt-6">
        <DataTable head={["Wedding", "Status", "Template", "Package", "Live until", ""]}
          empty={d.weddings.length === 0 ? <p className="p-4 text-sm text-mute">No weddings yet.</p> : null}>
          {d.weddings.map((w) => (
            <tr key={w.id}>
              <Td label="Wedding"><span className="font-semibold">{w.title}</span><span className="block text-xs text-mute">/{w.slug} · {w.weddingDate ? when(w.weddingDate) : "no date"}</span></Td>
              <Td label="Status"><StatusBadge status={w.status} />{w.blocked ? <Badge tone="danger" className="ml-1">Taken offline</Badge> : null}</Td>
              <Td label="Template">{w.templateName ?? "—"}</Td>
              <Td label="Package">{w.package ?? "None"} {w.packageStatus === "expired" ? <Badge tone="warning">Expired</Badge> : null}</Td>
              <Td label="Live until">{when(w.liveUntil)}</Td>
              <Td label=""><PackageActions weddingId={w.id} wedding={w.title} hasPackage={w.packageStatus !== "none"} tiers={tiers} isAdmin={staff.isAdmin} blocked={w.blocked} /></Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="Orders & payments" className="mt-6">
        <DataTable head={["Order", "Status", "Amount", "Package", "Wedding", "Date"]}
          empty={d.orders.length === 0 ? <p className="p-4 text-sm text-mute">No orders.</p> : null}>
          {d.orders.map((o) => (
            <tr key={o.id}>
              <Td label="Order"><Link className="font-mono text-xs hover:text-pink-dark" href={`/admin/orders?q=${o.orderNumber}`}>{o.orderNumber}</Link></Td>
              <Td label="Status"><Badge tone={o.status === "Paid" ? "success" : o.status === "Failed" ? "danger" : "neutral"}>{o.status}</Badge></Td>
              <Td label="Amount">{formatMoney(o.amountMinor, o.currency)}</Td>
              <Td label="Package">{o.package ?? "—"}</Td>
              <Td label="Wedding">{o.wedding ?? <span className="text-mute">Deleted</span>}</Td>
              <Td label="Date">{when(o.paidAt ?? o.createdAt)}</Td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="Recent activity" className="mt-6">
        {d.activity.length === 0 ? <p className="text-sm text-mute">Nothing recorded yet.</p> : (
          <ol className="space-y-2 text-sm">
            {d.activity.map((a) => (
              <li key={a.id} className="flex flex-wrap gap-x-3 border-b border-line pb-2 last:border-0">
                <span className="w-40 shrink-0 text-xs text-mute">{whenTime(a.at)}</span>
                <span className="min-w-0 flex-1">{describe(a)}{a.actorEmail && a.actorId !== u.id ? <span className="text-mute"> · by {a.actorEmail}</span> : null}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </>
  );
}
