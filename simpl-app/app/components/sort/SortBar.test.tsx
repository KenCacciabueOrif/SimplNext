// @vitest-environment jsdom
/**
 * Last updated: 2026-04-28
 * Purpose: Verify SortBar rendering — button labels, active indicators,
 *          and GPS prompt visibility based on permission state.
 *
 * Mocks:
 *   - geolocation/useGeoSort: returns controlled hook state.
 *   - next/navigation: useRouter / useSearchParams stubs.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks — declared before component import
// ---------------------------------------------------------------------------

const mockHandleToggle = vi.fn();
const mockRequestLocation = vi.fn();

vi.mock("@/app/components/geolocation/useGeoSort", () => ({
  useGeoSort: vi.fn(() => ({
    distanceError: null,
    isLocating: false,
    permissionState: "granted",
    handleToggle: mockHandleToggle,
    requestLocationFromUserAction: mockRequestLocation,
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/"),
}));

import { useGeoSort } from "@/app/components/geolocation/useGeoSort";
import SortBar from "@/app/components/sort/SortBar";

const DEFAULT_SORT_STATE = { popularity: "off" as const, date: "off" as const, distance: "off" as const };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SortBar", () => {
  beforeEach(() => {
    vi.mocked(useGeoSort).mockReturnValue({
      distanceError: null,
      isLocating: false,
      permissionState: "granted",
      handleToggle: mockHandleToggle,
      requestLocationFromUserAction: mockRequestLocation,
    });
  });

  // -------------------------------------------------------------------------
  // Basic rendering
  // -------------------------------------------------------------------------

  it("renders the sort controls div with aria-label", () => {
    render(<SortBar pathname="/" sortState={DEFAULT_SORT_STATE} viewerLocation={null} />);
    expect(screen.getByLabelText("Sort controls")).toBeInTheDocument();
  });

  it("renders Popularity, Date, and Distance buttons", () => {
    render(<SortBar pathname="/" sortState={DEFAULT_SORT_STATE} viewerLocation={null} />);
    expect(screen.getByRole("button", { name: /Popularity/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Date/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Distance/i })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Mode indicators
  // -------------------------------------------------------------------------

  it("shows = indicator when a sort mode is off", () => {
    render(<SortBar pathname="/" sortState={DEFAULT_SORT_STATE} viewerLocation={null} />);
    expect(screen.getByRole("button", { name: /Popularity =/i })).toBeInTheDocument();
  });

  it("shows ↓ indicator for down mode", () => {
    render(
      <SortBar pathname="/" sortState={{ ...DEFAULT_SORT_STATE, popularity: "down" }} viewerLocation={null} />
    );
    expect(screen.getByRole("button", { name: /Popularity ↓/i })).toBeInTheDocument();
  });

  it("shows ↑ indicator for up mode", () => {
    render(
      <SortBar pathname="/" sortState={{ ...DEFAULT_SORT_STATE, date: "up" }} viewerLocation={null} />
    );
    expect(screen.getByRole("button", { name: /Date ↑/i })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // GPS prompt visibility
  // -------------------------------------------------------------------------

  it("hides the GPS prompt when permission is granted", () => {
    render(<SortBar pathname="/" sortState={DEFAULT_SORT_STATE} viewerLocation={null} />);
    expect(screen.queryByRole("button", { name: /Activer la géolocalisation/i })).not.toBeInTheDocument();
  });

  it("shows the GPS activation button when permission is prompt", () => {
    vi.mocked(useGeoSort).mockReturnValue({
      distanceError: null,
      isLocating: false,
      permissionState: "prompt",
      handleToggle: mockHandleToggle,
      requestLocationFromUserAction: mockRequestLocation,
    });
    render(<SortBar pathname="/" sortState={DEFAULT_SORT_STATE} viewerLocation={null} />);
    expect(screen.getByRole("button", { name: /Activer la géolocalisation/i })).toBeInTheDocument();
  });

  it("shows a denied message when permission is denied", () => {
    vi.mocked(useGeoSort).mockReturnValue({
      distanceError: null,
      isLocating: false,
      permissionState: "denied",
      handleToggle: mockHandleToggle,
      requestLocationFromUserAction: mockRequestLocation,
    });
    render(<SortBar pathname="/" sortState={DEFAULT_SORT_STATE} viewerLocation={null} />);
    expect(screen.getByText(/Géolocalisation refusée/i)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  it("disables the Distance button while locating", () => {
    vi.mocked(useGeoSort).mockReturnValue({
      distanceError: null,
      isLocating: true,
      permissionState: "granted",
      handleToggle: mockHandleToggle,
      requestLocationFromUserAction: mockRequestLocation,
    });
    render(<SortBar pathname="/" sortState={DEFAULT_SORT_STATE} viewerLocation={null} />);
    expect(screen.getByRole("button", { name: /Distance\.\.\./i })).toBeDisabled();
  });
});
