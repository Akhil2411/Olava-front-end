import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const submit = vi.fn<(...args: unknown[]) => Promise<{ status: "success"; message: string }>>(async () => ({ status: "success", message: "Thank you!" }));
vi.mock("@/features/public/actions", () => ({ submitRsvpAction: (...args: unknown[]) => submit(...args) }));

import { RsvpForm } from "@/features/public/RsvpForm";
import { RsvpForm as RsvpFormView } from "@/templates/rsvp/RsvpForm";

const rsvp = { enabled: true, deadline: null, allowUndecided: false, maxPlusOnes: 2, collectMessage: false, isOpen: true };

describe("RsvpForm (live)", () => {
  it("follows the host's settings, with a guests stepper after accepting", async () => {
    render(<RsvpForm slug="priya-arjun" rsvp={rsvp} />);
    expect(screen.queryByText("Not sure yet")).toBeNull();               // undecided disabled
    expect(screen.queryByLabelText(/Message for the couple/)).toBeNull(); // messages disabled
    expect(screen.queryByRole("group", { name: "Guests coming with you" })).toBeNull();
    await userEvent.click(screen.getByLabelText("Joyfully accept"));
    const stepper = screen.getByRole("group", { name: "Guests coming with you" });
    expect(stepper).toHaveTextContent("Just me");
    const more = screen.getByRole("button", { name: "One more guest" });
    await userEvent.click(more);
    await userEvent.click(more);
    expect(stepper).toHaveTextContent("Me + 2");
    expect(more).toBeDisabled();                                         // the host's limit
    expect(document.querySelector<HTMLInputElement>('input[name="plusOneCount"]')!.value).toBe("2");
  });

  it("sends the reply and thanks the guest in the host's words", async () => {
    render(<RsvpForm slug="priya-arjun" rsvp={rsvp} labels={{ ...(await import("@/templates/content")).RSVP_LABEL_DEFAULTS, thanks: "See you there!" }} />);
    await userEvent.type(screen.getByLabelText("Your name"), "Meera");
    await userEvent.click(screen.getByLabelText("Regretfully decline"));
    await userEvent.click(screen.getByRole("button", { name: "Send RSVP" }));
    expect(await screen.findByRole("status")).toHaveTextContent("See you there!");
    const form = submit.mock.calls[0][2] as FormData;
    expect(form.get("fullName")).toBe("Meera");
    expect(form.get("status")).toBe("not_attending");
  });

  it("has a hidden honeypot field", () => {
    const { container } = render(<RsvpForm slug="priya-arjun" rsvp={rsvp} />);
    const honeypot = container.querySelector('input[name="website"]')!;
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(honeypot).toHaveAttribute("tabindex", "-1");
  });
});

describe("RsvpForm (try it, in previews)", () => {
  it("checks the answers like the real form, focuses the first problem and clears errors as they're fixed", async () => {
    render(<RsvpFormView rsvp={rsvp} mode="try" />);
    await userEvent.click(screen.getByRole("button", { name: "Send RSVP" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please check the highlighted fields.");
    expect(screen.getByLabelText("Your name")).toHaveFocus();
    expect(screen.getByLabelText("Your name")).toHaveAccessibleDescription("Please enter your name.");
    await userEvent.type(screen.getByLabelText("Your name"), "Meera");
    expect(screen.queryByText("Please enter your name.")).toBeNull();
    expect(screen.getByText("Please choose a response.")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Joyfully accept"));
    expect(screen.queryByRole("alert")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Send RSVP" }));
    expect(screen.getByRole("status")).toHaveTextContent("This is a preview, so your reply wasn't sent.");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
  });
});
