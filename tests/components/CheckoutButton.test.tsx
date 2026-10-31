import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  startCheckoutAction: vi.fn(),
  verifyPaymentAction: vi.fn(),
  cancelCheckoutAction: vi.fn(),
  refreshOrderAction: vi.fn(),
}));
vi.mock("@/features/billing/actions", () => actions);

import { CheckoutButton } from "@/features/billing/components/CheckoutButton";

const session = {
  orderId: "11111111-1111-1111-1111-111111111111", orderNumber: "OLV-1", amountMinor: 69900, currency: "INR", provider: "razorpay",
  providerOrderId: "order_1", providerKeyId: "rzp_test_x", description: "Olava Standard", prefill: { name: "P", email: "p@x.com" },
};
const order = (status: string) => ({ id: session.orderId, orderNumber: "OLV-1", weddingId: "w", productCode: "purchase.standard", tierCode: "standard",
  status, amountMinor: 69900, creditMinor: 0, currency: "INR", createdAt: "", paidAt: null, failureReason: status === "Failed" ? "Declined" : null });

let options: Record<string, unknown>;
beforeEach(() => {
  vi.clearAllMocks();
  window.Razorpay = vi.fn(function (this: unknown, o: Record<string, unknown>) { options = o; return { open: vi.fn(), on: vi.fn() }; }) as never;
  actions.startCheckoutAction.mockResolvedValue({ ok: true, data: session });
});

const success = { razorpay_payment_id: "pay_1", razorpay_order_id: "order_1", razorpay_signature: "sig" };

describe("CheckoutButton", () => {
  it("shows the server-provided amount and confirms only after server verification", async () => {
    actions.verifyPaymentAction.mockResolvedValue({ ok: true, data: order("Paid") });
    render(<CheckoutButton weddingId="w" amountMinor={69900} currency="INR" label="Pay" />);
    await userEvent.click(screen.getByRole("button", { name: /Pay · ₹699/ }));
    expect(options.order_id).toBe("order_1");
    expect(options.key).toBe("rzp_test_x");
    await (options.handler as (r: typeof success) => Promise<void>)(success);
    expect(actions.verifyPaymentAction).toHaveBeenCalledWith(session.orderId, { providerOrderId: "order_1", providerPaymentId: "pay_1", signature: "sig" });
    expect(await screen.findByText("Payment confirmed")).toBeInTheDocument();
  });

  it("treats a pending verification as processing, not paid", async () => {
    actions.verifyPaymentAction.mockResolvedValue({ ok: true, data: order("Pending") });
    actions.refreshOrderAction.mockResolvedValue({ ok: true, data: order("Pending") });
    render(<CheckoutButton weddingId="w" amountMinor={69900} currency="INR" label="Pay" />);
    await userEvent.click(screen.getByRole("button"));
    await (options.handler as (r: typeof success) => Promise<void>)(success);
    expect(await screen.findByText("Payment processing")).toBeInTheDocument();
    expect(screen.queryByText("Payment confirmed")).toBeNull();
  });

  it("shows a failure when the server rejects the payment", async () => {
    actions.verifyPaymentAction.mockResolvedValue({ ok: false, error: { status: 400, code: "payment.invalid_signature", message: "We couldn't verify this payment." } });
    render(<CheckoutButton weddingId="w" amountMinor={69900} currency="INR" label="Pay" />);
    await userEvent.click(screen.getByRole("button"));
    await (options.handler as (r: typeof success) => Promise<void>)(success);
    expect(await screen.findByText("We couldn't verify this payment.", { exact: false })).toBeInTheDocument();
  });

  it("cancels the order when the checkout window is closed", async () => {
    actions.cancelCheckoutAction.mockResolvedValue({ ok: true, data: order("Cancelled") });
    render(<CheckoutButton weddingId="w" amountMinor={69900} currency="INR" label="Pay" />);
    await userEvent.click(screen.getByRole("button"));
    await ((options.modal as { ondismiss: () => Promise<void> }).ondismiss)();
    expect(actions.cancelCheckoutAction).toHaveBeenCalledWith(session.orderId);
    expect(await screen.findByText(/No payment was taken/)).toBeInTheDocument();
  });

  it("surfaces 'payments not configured' from the server", async () => {
    actions.startCheckoutAction.mockResolvedValue({ ok: false, error: { status: 503, code: "payment.not_configured", message: "Online payment isn't configured." } });
    render(<CheckoutButton weddingId="w" amountMinor={69900} currency="INR" label="Pay" />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText(/isn't configured/)).toBeInTheDocument());
    expect(window.Razorpay).not.toHaveBeenCalled();
  });
});
