"use server";

import { badRequest, isId, revalidateWedding, toAction } from "@/lib/api/actions";
import type { ActionResult } from "@/lib/api/problem";
import { api } from "@/lib/api/server";
import type { CheckoutSession, Order } from "@/lib/api/types";

export async function startCheckoutAction(weddingId: string): Promise<ActionResult<CheckoutSession>> {
  if (!isId(weddingId)) return badRequest();
  return toAction(await api<CheckoutSession>(`/api/v1/weddings/${weddingId}/orders`, { method: "POST" }));
}

/**
 * Sends Razorpay's checkout callback to the API, which verifies the signature AND re-fetches the payment from
 * Razorpay before marking anything paid. The browser's word alone never unlocks publishing.
 */
export async function verifyPaymentAction(orderId: string, payload: { providerOrderId: string; providerPaymentId: string; signature: string }): Promise<ActionResult<Order>> {
  if (!isId(orderId)) return badRequest();
  const body = {
    providerOrderId: String(payload?.providerOrderId ?? "").slice(0, 64),
    providerPaymentId: String(payload?.providerPaymentId ?? "").slice(0, 64),
    signature: String(payload?.signature ?? "").slice(0, 256),
  };
  const result = toAction(await api<Order>(`/api/v1/orders/${orderId}/verify`, { body }));
  if (result.ok && result.data.weddingId) revalidateWedding(result.data.weddingId);
  return result;
}

export async function cancelCheckoutAction(orderId: string): Promise<ActionResult<Order>> {
  if (!isId(orderId)) return badRequest();
  return toAction(await api<Order>(`/api/v1/orders/${orderId}/cancel`, { method: "POST" }));
}

/** Polls order status; reconcile=true asks the provider directly (recovers a delayed/missed webhook). */
export async function refreshOrderAction(orderId: string): Promise<ActionResult<Order>> {
  if (!isId(orderId)) return badRequest();
  const result = toAction(await api<Order>(`/api/v1/orders/${orderId}?reconcile=true`));
  if (result.ok && result.data.status === "Paid" && result.data.weddingId) revalidateWedding(result.data.weddingId);
  return result;
}
