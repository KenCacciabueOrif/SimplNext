> Last updated: 2026-04-28
> Changes: Initial README — documented schema models, seed architecture, and migration workflow.

# prisma

Database schema definition and development seed data for Simpl. Uses PostgreSQL with Prisma ORM and the Prisma Accelerate extension.

## Schema (`schema.prisma`)

The schema defines four main models:

| Model | Purpose |
|---|---|
| `Actor` | Anonymous user identity — cookie-keyed, no personal data. |
| `Post` | Root posts and replies (self-referential `parentId`/`rootId`). Carries geolocation coordinates, reaction counts, and a `PostStatus`. |
| `Reaction` | Like or Dislike from an `Actor` on a `Post`. One reaction per actor per post, togglable. |
| `ModerationVote` | Keep or Remove vote from an `Actor` on a `Post`. One vote per actor per post. |

**Enums:**
- `PostStatus` — `ACTIVE | UNDER_REVIEW | HIDDEN | REMOVED`
- `ReactionType` — `LIKE | DISLIKE`
- `ModerationDecision` — `KEEP | REMOVE`

## Seed Files

The seed is split into focused submodules orchestrated by `seed.ts`:

| File | Purpose |
|---|---|
| `seed.ts` | Orchestrator — clears existing data, calls each phase in order, disconnects. |
| `seed-actors.ts` | Creates 12 named anonymous actors. |
| `seed-posts.ts` | Creates 28 test posts across various geolocation positions and status scenarios. |
| `seed-interactions.ts` | Creates reactions and moderation votes on seeded posts to exercise all policy branches. |
| `seed-helpers.ts` | Shared Prisma factory functions and the `updatePostCounters` sync utility used by all seed modules. |

## Migrations

Migrations live in `migrations/`. Run the following commands during development:

```bash
# Apply pending migrations
npx prisma migrate dev

# Reset database and re-seed
npx prisma migrate reset

# Seed only (no schema change)
npx prisma db seed
```

## Maintenance Steps

1. After any `schema.prisma` change, run `npx prisma migrate dev --name <description>` to generate a migration.
2. Keep `seed-posts.ts` covering all `PostStatus` variants and edge cases for policy evaluation.
3. `seed-helpers.ts` must stay generic — no scenario-specific logic; that belongs in `seed-posts.ts` or `seed-interactions.ts`.
4. Never commit a `.env` file containing real database credentials.
