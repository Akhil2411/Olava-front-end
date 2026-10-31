"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Alert, Button } from "@/components/ui";
import type { Order } from "@/lib/api/types";
import { formatMoney } from "@/lib/utils/format";
import { cancelCheckoutAction, refreshOrderAction, startCheckoutAction, verifyPaymentAction } from "../actions";
import { loadRazorpay, type RazorpaySuccess } from "./razorpay";

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "paying" }
  | { kind: "verifying" }
  | { kind: "pending"; order: Order }
  | { kind: "paid" }
  | { kind: "failed"; message: string }
  | { kind: "cancelled" };

const POLL_MS = 3000;
const POLL_LIMIT = 20; // ~1 minute, then we tell the host it's still processing

/**
 * Razorpay Checkout. The success callback only forwards the signed result to our server; the server
 * verifies it with Razorpay before the order counts as paid. A delayed payment shows "processing" and is
 * polled; the webhook finishes it even if this page is closed.
 */
export function CheckoutButton({ weddingId, amountMinor, currency, label }: { weddingId: string; amountMinor: number; currency: string; label: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const finished = useRef(false);

  const poll = async (orderId: string, attempt = 0): Promise<void> => {
    const result = await refreshOrderAction(orderId);
    if (result.ok && result.data.status === "Paid") { setPhase({ kind: "paid" }); router.refresh(); return; }
    if (result.ok && result.data.status === "Failed") { setPhase({ kind: "failed", message: result.data.failureReason ?? "The payment didn't go through." }); return; }
    if (result.ok) setPhase({ kind: "pending", order: result.data });
    if (attempt < POLL_LIMIT) setTimeout(() => void poll(orderId, attempt + 1), POLL_MS);
  };

  const start = async () => {
    finished.current = false;
    setPhase({ kind: "starting" });
    const session = await startCheckoutAction(weddingId);
    if (!session.ok) { setPhase({ kind: "failed", message: session.error.message }); return; }
    try {
      await loadRazorpay();
    } catch (e) {
      setPhase({ kind: "failed", message: (e as Error).message });
      return;
    }
    const s = session.data;
    const rzp = new window.Razorpay!({
      key: s.providerKeyId,
      order_id: s.providerOrderId,
      amount: s.amountMinor,
      currency: s.currency,
      name: "Olava Invites",
      description: s.description,
      prefill: { name: s.prefill.name ?? undefined, email: s.prefill.email ?? undefined },
      theme: { color: "#b0507f" },
      handler: async (response: RazorpaySuccess) => {
        finished.current = true;
        setPhase({ kind: "verifying" });
        const verified = await verifyPaymentAction(s.orderId, {
          providerOrderId: response.razorpay_order_id,
          providerPaymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
        if (!verified.ok) { setPhase({ kind: "failed", message: verified.error.message }); return; }
        if (verified.data.status === "Paid") { setPhase({ kind: "paid" }); router.refresh(); return; }
        if (verified.data.status === "Failed") { setPhase({ kind: "failed", message: verified.data.failureReason ?? "The payment didn't go through." }); return; }
        setPhase({ kind: "pending", order: verified.data });
        void poll(s.orderId);
      },
      modal: {
        ondismiss: async () => {
          if (finished.current) return;
          await cancelCheckoutAction(s.orderId);
          setPhase({ kind: "cancelled" });
        },
      },
    });
    rzp.on("payment.failed", (r) => {
      // Razorpay lets the customer retry inside the same window; we just show the reason.
      setPhase({ kind: "failed", message: r.error?.description ?? "The payment was declined. You can try again." });
    });
    setPhase({ kind: "paying" });
    rzp.open();
  };

  const busy = phase.kind === "starting" || phase.kind === "paying" || phase.kind === "verifying";

  return (
    <div className="space-y-3">
      {phase.kind === "paid" ? <Alert tone="success" title="Payment confirmed">Thank you! You can now publish your website.</Alert> : null}
      {phase.kind === "pending" ? (
        <Alert tone="info" title="Payment processing">
          We&apos;re waiting for the bank to confirm order {phase.order.orderNumber}. This page updates automatically, and you can leave it: we&apos;ll finish it in the background.
        </Alert>
      ) : null}
      {phase.kind === "failed" ? <Alert tone="error" title="Payment not completed">{phase.message} You haven&apos;t been charged for a failed payment.</Alert> : null}
      {phase.kind === "cancelled" ? <Alert tone="warning">Checkout closed. No payment was taken. You can try again whenever you&apos;re ready.</Alert> : null}
      {phase.kind !== "paid" ? (
        <Button size="lg" onClick={start} loading={busy} disabled={phase.kind === "pending"}>
          {phase.kind === "verifying" ? "Confirming payment…" : `${label} · ${formatMoney(amountMinor, currency)}`}
        </Button>
      ) : null}
      <p className="text-xs text-mute">Secure payment by Razorpay (UPI, cards, net banking). Test mode in development.</p>
    </div>
  );
}
