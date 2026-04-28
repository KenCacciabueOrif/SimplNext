> Last updated: 2026-04-28
> Changes: Initial README — documented layout component responsibilities, geo-aware navigation contract, and accessibility notes.

# app/components/layout

Persistent shell components rendered at the root layout level. These components control global navigation and contextual back-links.

## Files

| File | Purpose |
|---|---|
| `AppTabs.tsx` | Primary tab navigation bar (Home / Moderation). Builds tab hrefs using `tabNavigation.ts` helpers to preserve active sort and geolocation query context across tab switches. Applies `aria-current="page"` to the active tab for accessibility. |
| `GeoAwareBackLink.tsx` | Back-link that restores active geolocation coordinates and distance mode from browser state when returning from a thread or comment page, preventing a Distance reset to `off`. |

## Test Files

| File | Covers |
|---|---|
| `AppTabs.test.tsx` | Tab rendering, active state, geolocation context preservation across tab switches. |

## Key Code Comments

- [`AppTabs.tsx` L1–6](AppTabs.tsx#L1) — Documents the `aria-current="page"` addition from phase D and its relation to the active class.
- [`GeoAwareBackLink.tsx` L1–7](GeoAwareBackLink.tsx#L1) — Documents the back-link geo restoration hardening (stale activity marker handling).

## Maintenance Steps

1. `AppTabs` must use `tabNavigation.ts` helpers for all tab hrefs — do not build query strings inline.
2. `GeoAwareBackLink` must use `backLinkNavigation.ts` helpers — do not duplicate URL-building logic in the component.
3. New global navigation elements (e.g., a header, a sidebar) belong in this folder.
4. Run `npm run quality:ci` after any change.
