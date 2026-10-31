import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ShareButtons } from "@/features/sharing/ShareButtons";

describe("ShareButtons", () => {
  const url = "https://olava.test/w/priya-arjun";

  it("WhatsApp link carries the stable public URL", () => {
    render(<ShareButtons url={url} text="We're getting married!" />);
    const href = screen.getByRole("link", { name: /Share on WhatsApp/ }).getAttribute("href")!;
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(href)).toContain(url);
  });

  it("copies the URL and confirms", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<ShareButtons url={url} text="x" />);
    await user.click(screen.getByRole("button", { name: /Copy link/ }));
    expect(writeText).toHaveBeenCalledWith(url);
    expect(screen.getByRole("button", { name: /Link copied/ })).toBeInTheDocument();
  });

  it("offers the native share sheet only where supported", () => {
    render(<ShareButtons url={url} text="x" />);
    expect(screen.queryByRole("button", { name: /Share…/ })).toBeNull(); // jsdom has no navigator.share
  });
});
