import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({ verifyEmailAction: vi.fn(), resendCodeAction: vi.fn() }));
vi.mock("@/features/auth/actions", () => actions);

import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";

describe("VerifyEmailForm", () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); actions.resendCodeAction.mockReset(); });
  afterEach(() => vi.useRealTimers());

  it("names the address, offers a one-time-code field, and counts down before a new code can be requested", async () => {
    render(<VerifyEmailForm email="asha@example.com" resendAt={Date.now() + 3000} sent />);
    expect(screen.getByText("asha@example.com")).toBeInTheDocument();
    const field = screen.getByLabelText(/Verification code/);
    expect(field).toHaveAttribute("autocomplete", "one-time-code");
    expect(field).toHaveAttribute("inputmode", "numeric");
    const resend = screen.getByRole("button", { name: /Send a new code in 3s/ });
    expect(resend).toBeDisabled();
    await act(async () => { vi.advanceTimersByTime(3100); });
    expect(screen.getByRole("button", { name: "Send a new code" })).toBeEnabled();
  });

  it("asks for a new code and shows the result, then waits again", async () => {
    actions.resendCodeAction.mockResolvedValue({ status: "sent", resendAt: Date.now() + 60_000, message: "We've sent a new code. Check your inbox (and spam folder)." });
    render(<VerifyEmailForm email="asha@example.com" resendAt={0} sent />);
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole("button", { name: "Send a new code" }));
    expect(await screen.findByText(/We've sent a new code/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send a new code in \d+s/ })).toBeDisabled();
  });

  it("says so when the first email couldn't be sent", () => {
    render(<VerifyEmailForm email="asha@example.com" resendAt={0} sent={false} />);
    expect(screen.getByText(/couldn.t send the code/)).toBeInTheDocument();
  });
});
