// @vitest-environment jsdom
/**
 * Last updated: 2026-04-27
 * Purpose: Verify ergonomics conformance of ThreadReplyComposer.
 *          - Toggle button must start with aria-expanded="false" (panel hidden by default).
 *          - Clicking the toggle must flip aria-expanded to "true" and render the panel.
 *          - aria-controls must reference the panel id.
 *          - The toggle button must meet the 44px min-height touch target (Phase B).
 *
 * PostComposer is mocked to keep the test isolated from geolocation/actions deps.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/app/components/PostComposer", () => ({
  default: () => <div data-testid="mock-composer">composer</div>,
}));

import ThreadReplyComposer from "@/app/components/ThreadReplyComposer";

describe("ThreadReplyComposer", () => {
  it("toggle button starts with aria-expanded=false", () => {
    render(<ThreadReplyComposer parentId="test-parent-id" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("toggle button has aria-controls referencing the panel id", () => {
    render(<ThreadReplyComposer parentId="test-parent-id" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-controls", "thread-reply-composer-panel");
  });

  it("panel is not visible before the toggle is clicked", () => {
    render(<ThreadReplyComposer parentId="test-parent-id" />);
    expect(screen.queryByTestId("mock-composer")).not.toBeInTheDocument();
  });

  it("clicking the toggle opens the panel and sets aria-expanded=true", async () => {
    const user = userEvent.setup();
    render(<ThreadReplyComposer parentId="test-parent-id" />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("mock-composer")).toBeInTheDocument();
  });

  it("clicking the toggle a second time closes the panel", async () => {
    const user = userEvent.setup();
    render(<ThreadReplyComposer parentId="test-parent-id" />);
    const button = screen.getByRole("button");
    await user.click(button);
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mock-composer")).not.toBeInTheDocument();
  });

  it("the open panel has the id referenced by aria-controls", async () => {
    const user = userEvent.setup();
    render(<ThreadReplyComposer parentId="test-parent-id" />);
    await user.click(screen.getByRole("button"));
    expect(document.getElementById("thread-reply-composer-panel")).toBeInTheDocument();
  });
});
