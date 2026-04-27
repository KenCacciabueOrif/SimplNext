// @vitest-environment jsdom
/**
 * Last updated: 2026-04-27
 * Purpose: Verify ergonomics conformance of AppTabs navigation.
 *          - The nav element must carry aria-label="Primary".
 *          - The active link must have aria-current="page" (Phase D).
 *          - The inactive link must not have aria-current.
 *
 * Mocks:
 *   - next/navigation: usePathname returns "/" (Home active) or "/moderation".
 *   - next/link: rendered as a plain <a> element.
 *   - geolocation/tabNavigation: buildHomeTabHref returns "/" unconditionally.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any import of the component.
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => ({ toString: () => "" })),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/components/geolocation/tabNavigation", () => ({
  buildHomeTabHref: vi.fn(() => "/"),
}));

import { usePathname } from "next/navigation";
import AppTabs from "@/app/components/AppTabs";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AppTabs", () => {
  describe("when Home is active (pathname='/')", () => {
    beforeEach(() => {
      vi.mocked(usePathname).mockReturnValue("/");
    });

    it("renders a <nav> with aria-label='Primary'", () => {
      render(<AppTabs />);
      expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    });

    it("Home link has aria-current='page'", () => {
      render(<AppTabs />);
      const homeLink = screen.getByRole("link", { name: "Home" });
      expect(homeLink).toHaveAttribute("aria-current", "page");
    });

    it("Moderation link does not have aria-current", () => {
      render(<AppTabs />);
      const modLink = screen.getByRole("link", { name: "Moderation" });
      expect(modLink).not.toHaveAttribute("aria-current");
    });
  });

  describe("when Moderation is active (pathname='/moderation')", () => {
    beforeEach(() => {
      vi.mocked(usePathname).mockReturnValue("/moderation");
    });

    it("Moderation link has aria-current='page'", () => {
      render(<AppTabs />);
      const modLink = screen.getByRole("link", { name: "Moderation" });
      expect(modLink).toHaveAttribute("aria-current", "page");
    });

    it("Home link does not have aria-current", () => {
      render(<AppTabs />);
      const homeLink = screen.getByRole("link", { name: "Home" });
      expect(homeLink).not.toHaveAttribute("aria-current");
    });
  });
});
