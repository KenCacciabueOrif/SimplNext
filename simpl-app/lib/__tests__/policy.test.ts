import { PostStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { evaluateModerationPolicy } from "@/lib/policy";

describe("evaluateModerationPolicy", () => {
  // -------------------------------------------------------------------------
  // Below threshold
  // -------------------------------------------------------------------------

  it("returns UNDER_REVIEW when total votes < 10", () => {
    const result = evaluateModerationPolicy(4, 5);
    expect(result.status).toBe(PostStatus.UNDER_REVIEW);
    expect(result.inModeration).toBe(true);
    expect(result.visibleOnHomepage).toBe(true);
    expect(result.shouldDelete).toBe(false);
    expect(result.totalVotes).toBe(9);
  });

  it("returns UNDER_REVIEW for zero votes", () => {
    const result = evaluateModerationPolicy(0, 0);
    expect(result.status).toBe(PostStatus.UNDER_REVIEW);
    expect(result.visibleOnHomepage).toBe(true);
    expect(result.shouldDelete).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Remove strong majority → delete
  // -------------------------------------------------------------------------

  it("returns REMOVED when remove >= 2× keep (exact ratio at threshold)", () => {
    // 10 keep, 20 remove → total 30, remove = 2× keep
    const result = evaluateModerationPolicy(10, 20);
    expect(result.status).toBe(PostStatus.REMOVED);
    expect(result.shouldDelete).toBe(true);
    expect(result.inModeration).toBe(false);
    expect(result.visibleOnHomepage).toBe(false);
  });

  it("returns REMOVED when remove >> keep", () => {
    const result = evaluateModerationPolicy(2, 10);
    expect(result.status).toBe(PostStatus.REMOVED);
    expect(result.shouldDelete).toBe(true);
  });

  it("returns REMOVED when keep is 0 and remove >= threshold", () => {
    const result = evaluateModerationPolicy(0, 10);
    expect(result.status).toBe(PostStatus.REMOVED);
    expect(result.shouldDelete).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Keep strong majority → clear from moderation
  // -------------------------------------------------------------------------

  it("returns ACTIVE when keep >= 2× remove", () => {
    const result = evaluateModerationPolicy(20, 6);
    expect(result.status).toBe(PostStatus.ACTIVE);
    expect(result.inModeration).toBe(false);
    expect(result.visibleOnHomepage).toBe(true);
    expect(result.shouldDelete).toBe(false);
  });

  it("returns ACTIVE when remove is 0 and keep >= threshold", () => {
    const result = evaluateModerationPolicy(10, 0);
    expect(result.status).toBe(PostStatus.ACTIVE);
    expect(result.shouldDelete).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Remove majority (no strong ratio) → hidden
  // -------------------------------------------------------------------------

  it("returns HIDDEN when remove > keep but no strong majority", () => {
    // 8 keep, 12 remove → 20 total; remove is 1.5× keep (< 2×)
    const result = evaluateModerationPolicy(8, 12);
    expect(result.status).toBe(PostStatus.HIDDEN);
    expect(result.inModeration).toBe(true);
    expect(result.visibleOnHomepage).toBe(false);
    expect(result.shouldDelete).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Default: tied or keep > remove without strong majority → UNDER_REVIEW
  // -------------------------------------------------------------------------

  it("returns UNDER_REVIEW when votes are tied above threshold", () => {
    const result = evaluateModerationPolicy(10, 10);
    expect(result.status).toBe(PostStatus.UNDER_REVIEW);
    expect(result.visibleOnHomepage).toBe(true);
  });

  it("returns UNDER_REVIEW when keep > remove without strong majority above threshold", () => {
    // 12 keep, 9 remove → 21 total; keep is 1.33× remove (< 2×)
    const result = evaluateModerationPolicy(12, 9);
    expect(result.status).toBe(PostStatus.UNDER_REVIEW);
    expect(result.visibleOnHomepage).toBe(true);
  });

  it("reports correct totalVotes", () => {
    const result = evaluateModerationPolicy(7, 5);
    expect(result.totalVotes).toBe(12);
  });
});
