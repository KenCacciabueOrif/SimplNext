// @vitest-environment jsdom
/**
 * Last updated: 2026-04-27
 * Purpose: Verify ergonomics conformance of the Loading component.
 *          - role="status" must be present so screen readers announce the state.
 *          - aria-label must carry the loading message.
 *          - Visual skeleton cards must be rendered (Phase D).
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Loading from "@/app/loading";

describe("Loading", () => {
  it("renders a status landmark for screen readers", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("carries an accessible label on the status element", () => {
    render(<Loading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Chargement…");
  });

  it("renders at least two skeleton card elements", () => {
    render(<Loading />);
    const cards = document.querySelectorAll(".loading-skeleton-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it("renders a visible loading label for sighted users", () => {
    render(<Loading />);
    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });
});
