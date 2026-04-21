> Last updated: 2026-04-21
> Changes: Documented the responsive UI pass, the larger dataset, the geolocation-backed distance sorting, and a new todo for slow action-button refresh feedback.

# Simpl.

Local social network with community moderation.

## Purpose

- Rebuild the original Simpl prototype inside a single Next.js application.
- Keep the product behavior centered on local posts, replies, reactions, and community moderation.
- Use Prisma with PostgreSQL as the persistence layer for the new implementation.

## Current Implementation

- Main feed on [app/page.tsx](app/page.tsx).
- Thread page on [app/posts/[id]/page.tsx](app/posts/%5Bid%5D/page.tsx).
- Post creation page on [app/posts/new/page.tsx](app/posts/new/page.tsx).
- Moderation queue on [app/moderation/page.tsx](app/moderation/page.tsx).
- Server actions on [app/actions.ts](app/actions.ts).
- Legacy-style top tabs on [app/components/AppTabs.tsx](app/components/AppTabs.tsx).
- Legacy-style sort row on [app/components/SortBar.tsx](app/components/SortBar.tsx).
- Shared post queries and anonymous actor helpers on [lib/simpl.ts](lib/simpl.ts).
- Prisma client setup on [lib/prisma.ts](lib/prisma.ts).
- Prisma domain schema on [prisma/schema.prisma](prisma/schema.prisma).
- Seed data on [prisma/seed.ts](prisma/seed.ts).

## Architecture Notes

- The app uses anonymous actors stored through a stable server-side cookie and persisted in PostgreSQL.
- Posts and replies share the same `Post` model through a self-relation.
- Reactions and moderation votes are normalized into separate tables instead of storing user arrays on the post record.
- The new Simpl tables are isolated from the earlier demo schema through dedicated table names.
- The visual shell now follows the original Simpl prototype much more closely: centered title bar, Home/Moderation tabs, sort row, stacked post cards, and black/white borders.
- The layout now adapts more cleanly to narrow, medium, and wide windows while keeping the same legacy visual language.
- The `Distance` sort now uses browser geolocation and real post coordinates instead of a placeholder value.

## Important Code Comments

- [app/actions.ts](app/actions.ts): server-side mutation entry point for create, react, and moderate flows.
- [lib/simpl.ts](lib/simpl.ts): server-side query helpers and actor identity helpers.
- [prisma/schema.prisma](prisma/schema.prisma): PostgreSQL Simpl data model.
- [lib/prisma.ts](lib/prisma.ts): shared Prisma client lifecycle.

## Run Steps

1. Install dependencies with `npm install`.
2. Ensure `DATABASE_URL` is set in `.env`.
3. Synchronize the schema with `npx prisma db push`.
4. Seed development data with `npx prisma db seed`.
5. Start the app with `npm run dev`.

## Seed Coverage

- The seed now creates more than twenty posts in total.
- It includes root posts, reply chains, liked/disliked items, and multiple moderation states.
- This larger dataset is intended to make responsive feed and thread testing much more realistic.

## Maintenance Steps

1. Update this README whenever routes, schema responsibilities, or major data flows change.
2. Keep `prisma/schema.prisma` and `prisma/seed.ts` aligned when new required fields are introduced.
3. Document any new top-level page or server action entry point here.
4. Keep generated folders such as `.next` and `node_modules` out of the documentation scope.

## Known Constraint

- The local editor reports a Prisma schema warning about `datasource.url` because the Prisma extension expects a newer configuration style. The installed Prisma CLI for this project still requires the datasource URL in `schema.prisma`, and the actual build passes with the current setup.

## Todo

- Refine the distance fallback UX when geolocation is denied or unavailable.
- Improve the refresh/feedback speed of Like, DisLike, Good, and Bad actions after a click.
- Add richer thread navigation for deeper reply trees.
- Add a clearer moderation policy UI and status explanations.


