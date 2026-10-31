import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({ importGuestsAction: vi.fn(), saveGuestAction: vi.fn(), deleteGuestAction: vi.fn() }));
vi.mock("@/features/guests/actions", () => actions);

import { CsvImport } from "@/features/guests/components/CsvImport";

const file = new File(["full_name,email\nRavi,bad\n"], "guests.csv", { type: "text/csv" });

describe("CsvImport", () => {
  it("lists row errors and keeps Import disabled when the file is invalid", async () => {
    actions.importGuestsAction.mockResolvedValue({ ok: false, error: { status: 400, code: "guests.import_invalid", message: "The file has errors.",
      details: { rowErrors: [{ row: 2, column: "email", message: "Not a valid email." }] } } });
    render(<CsvImport weddingId="w" open onClose={() => {}} />);
    await userEvent.upload(screen.getByLabelText(/CSV file/), file);
    await userEvent.click(screen.getByRole("button", { name: "Check file" }));
    expect(await screen.findByText("Row 2 (email): Not a valid email.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import/ })).toBeDisabled();
  });

  it("validates first (dry run), then imports", async () => {
    actions.importGuestsAction
      .mockResolvedValueOnce({ ok: true, data: { dryRun: true, committed: false, totalRows: 2, toCreate: 1, toUpdate: 0, skippedDuplicates: 1, errors: [] } })
      .mockResolvedValueOnce({ ok: true, data: { dryRun: false, committed: true, totalRows: 2, toCreate: 1, toUpdate: 0, skippedDuplicates: 1, errors: [] } });
    render(<CsvImport weddingId="w" open onClose={() => {}} />);
    await userEvent.upload(screen.getByLabelText(/CSV file/), file);
    await userEvent.click(screen.getByRole("button", { name: "Check file" }));
    expect(await screen.findByText(/1 new · 0 to update · 1 duplicates skipped/)).toBeInTheDocument();
    expect((actions.importGuestsAction.mock.calls[0][1] as FormData).get("dryRun")).toBe("true");
    await userEvent.click(screen.getByRole("button", { name: /Import 1 guests/ }));
    expect(await screen.findByText("Import complete")).toBeInTheDocument();
    expect((actions.importGuestsAction.mock.calls[1][1] as FormData).get("dryRun")).toBe("false");
  });
});
