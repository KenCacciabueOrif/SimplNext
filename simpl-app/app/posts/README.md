> Last updated: 2026-04-28
> Changes: Initial README — documented posts folder routes, redirect behavior, and navigation context rules.

# app/posts

Next.js route segments for post-related pages. All pages in this folder are server components that read sort and geolocation state from URL search params and cookies.

## Routes

| Route | File | Purpose |
|---|---|---|
| `/posts` | `page.tsx` | Permanent redirect to `/` — keeps the legacy entry point compatible while the feed lives on the home route. |
| `/posts/new` | `new/page.tsx` | Top-level post creation page. Renders `PostComposer` with active sort context preserved in the back-navigation link. |
| `/posts/[id]` | `[id]/page.tsx` | Thread page for a selected post. Renders the main post card, sorted replies, a `ThreadReplyComposer`, and a `GeoAwareBackLink` back to the feed. |

## Key Code Comments

- [`[id]/page.tsx` L1–6]([id]/page.tsx#L1) — Documents tri-state filter sorting for replies and context preservation in thread nav links.
- [`new/page.tsx` L1–5](new/page.tsx#L1) — Documents feed sort + geo query carry-over in the back-navigation link.

## Maintenance Steps

1. All pages here are server components — do not add `"use client"` to page files.
2. Sort state and viewer location must be resolved from `searchParams` and cookies using `lib/navigation` and `lib/viewer-location` helpers.
3. Do not duplicate sort-mode parsing logic in page files; use `resolveFeedSortState` from `lib/simpl` or `lib/navigation`.
4. If a new route is added, create a corresponding entry in this README.
