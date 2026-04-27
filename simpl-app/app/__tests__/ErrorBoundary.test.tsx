// @vitest-environment jsdom
/**
 * Last updated: 2026-04-27
 * Purpose: Verify ergonomics conformance of the GlobalError (error boundary) component.
 *          - role="alert" must be present for immediate screen reader announcement.
 *          - The component must contain a heading and a human-readable description.
 *          - The reset button must be keyboard accessible (focusable, correct type).
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GlobalError from "@/app/error";

describe("GlobalError", () => {
  const mockError = Object.assign(new Error("Test error"), { digest: "test-digest" });

  it("renders an alert landmark for immediate screen reader announcement", () => {
    render(<GlobalError error={mockError} reset={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("contains a heading describing the error state", () => {
    render(<GlobalError error={mockError} reset={vi.fn()} />);
    expect(screen.getByRole("heading")).toBeInTheDocument();
  });

  it("renders a human-readable description of what went wrong", () => {
    render(<GlobalError error={mockError} reset={vi.fn()} />);
    expect(screen.getByText(/quelque chose/i)).toBeInTheDocument();
  });

  it("renders a reset button that is keyboard accessible", () => {
    render(<GlobalError error={mockError} reset={vi.fn()} />);
    const button = screen.getByRole("button", { name: /réessayer/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
  });

  it("calls the reset callback when the button is clicked", async () => {
    const reset = vi.fn();
    render(<GlobalError error={mockError} reset={reset} />);
    screen.getByRole("button", { name: /réessayer/i }).click();
    expect(reset).toHaveBeenCalledOnce();
  });
});
