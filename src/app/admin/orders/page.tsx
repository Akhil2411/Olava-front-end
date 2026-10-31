import Link from "next/link";
import { Badge, EmptyState } from "@/components/ui";
import { getOrders } from "@/features/admin/data";
import { DataTable, FilterBar, FilterInput, FilterSelect, PageHeader, Pager, Td, whenTime } from "@/features/admin/components/ui";
import { formatMoney } from "@/lib/utils/format";

const TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = { Paid: "success", Pending: "warning", Failed: "danger", Cancelled: "neutral", Refunded: "neutral" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Number(sp.page) || 1;
  const data = await getOrders({ q, status, page });
  const href = (p: number) => `/admin/orders?${new URLSearchParams({ q, status, page: String(p) })}`;
  return (
    <>
      <PageHeader title="Orders & payments" description="Read-only. Refunds and disputes are handled in the Razorpay dashboard." />
      <FilterBar action="/admin/orders">
        <FilterInput name="q" label="Search" defaultValue={q} placeholder="Order number, email or payment ID" />
        <FilterSelect name="status" label="Status" defaultValue={status} options={[["", "All"], ["paid", "Paid"], ["pending", "Pending"], ["failed", "Failed"], ["cancelled", "Cancelled"], ["refunded", "Refunded"]]} />
      </FilterBar>
      <DataTable head={["Order", "Customer", "Package", "Amount", "Status", "Payments"]}
        empty={data.items.length === 0 ? <EmptyState title="No orders match">Try another search or filter.</EmptyState> : null}>
        {data.items.map((o) => (
          <tr key={o.id} className="align-top hover:bg-blush/60">
            <Td label="Order"><span className="font-semibold">{o.orderNumber}</span><span className="block text-xs text-mute">{whenTime(o.createdAt)}</span></Td>
            <Td label="Customer">{o.ownerEmail ?? <span className="text-mute">Deleted account</span>}<span className="block text-xs text-mute">{o.wedding ?? "—"}</span></Td>
            <Td label="Package">{o.package ?? o.productCode}</Td>
            <Td label="Amount">{formatMoney(o.amountMinor, o.currency)}{o.creditMinor ? <span className="block text-xs text-mute">after {formatMoney(o.creditMinor, o.currency)} upgrade credit</span> : null}</Td>
            <Td label="Status">
              <Badge tone={TONE[o.status] ?? "neutral"}>{o.status}</Badge>
              {o.paidAt ? <span className="block text-xs text-mute">Paid {whenTime(o.paidAt)}</span> : null}
              {o.failureReason ? <span className="block max-w-48 text-xs text-danger">{o.failureReason}</span> : null}
            </Td>
            <Td label="Payments">
              {o.payments.length ? o.payments.map((p) => (
                <span key={p.providerPaymentId} className="block text-xs"><code>{p.providerPaymentId}</code> · {p.status}{p.method ? ` · ${p.method}` : ""}{p.error ? <span className="text-danger"> · {p.error}</span> : null}</span>
              )) : <span className="text-xs text-mute">{o.providerReference ? <code>{o.providerReference}</code> : "None"}</span>}
              {o.weddingId ? <Link href={`/admin/sites?q=${encodeURIComponent(o.ownerEmail ?? "")}`} className="mt-1 block text-xs text-pink-dark underline">Wedding</Link> : null}
            </Td>
          </tr>
        ))}
      </DataTable>
      <Pager page={data.page} pageSize={data.pageSize} total={data.totalCount} href={href} />
    </>
  );
}
