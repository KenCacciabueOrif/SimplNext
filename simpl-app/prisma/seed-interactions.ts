/**
 * Last updated: 2026-04-27
 * Purpose: Seeds all reactions and moderation votes for the fixture posts.
 *   Scenario comments describe the exact vote distribution needed to exercise
 *   each branch of the moderation policy at the 10-vote threshold.
 */

import { ModerationDecision, PrismaClient, ReactionType } from "@prisma/client";
import { type SeedActors } from "./seed-actors";
import { type SeedPosts } from "./seed-posts";

// ------------------------------
// Interaction seeding
// ------------------------------

export async function createInteractions(
  prisma: PrismaClient,
  actors: SeedActors,
  posts: SeedPosts,
) {
  const { alice, bob, clara, diego, emma, farid, gina, hugo, ines } = actors;
  const { rootPosts, replyPosts, flaggedPost, hiddenPost, moderationScenarioPosts } = posts;

  await prisma.reaction.createMany({
    data: [
      { actorId: bob.id, postId: rootPosts[0].id, type: ReactionType.LIKE },
      { actorId: clara.id, postId: rootPosts[0].id, type: ReactionType.LIKE },
      { actorId: diego.id, postId: rootPosts[1].id, type: ReactionType.LIKE },
      { actorId: emma.id, postId: rootPosts[1].id, type: ReactionType.LIKE },
      { actorId: alice.id, postId: rootPosts[2].id, type: ReactionType.LIKE },
      { actorId: emma.id, postId: rootPosts[2].id, type: ReactionType.DISLIKE },
      { actorId: alice.id, postId: rootPosts[4].id, type: ReactionType.LIKE },
      { actorId: bob.id, postId: rootPosts[4].id, type: ReactionType.LIKE },
      { actorId: clara.id, postId: rootPosts[5].id, type: ReactionType.LIKE },
      { actorId: diego.id, postId: rootPosts[7].id, type: ReactionType.LIKE },
      { actorId: emma.id, postId: rootPosts[8].id, type: ReactionType.LIKE },
      { actorId: bob.id, postId: rootPosts[10].id, type: ReactionType.LIKE },
      { actorId: clara.id, postId: rootPosts[12].id, type: ReactionType.LIKE },
      { actorId: alice.id, postId: rootPosts[15].id, type: ReactionType.LIKE },
      { actorId: diego.id, postId: rootPosts[19].id, type: ReactionType.LIKE },
      { actorId: alice.id, postId: replyPosts[0].id, type: ReactionType.LIKE },
      { actorId: clara.id, postId: replyPosts[1].id, type: ReactionType.LIKE },
      { actorId: bob.id, postId: replyPosts[2].id, type: ReactionType.LIKE },
      { actorId: alice.id, postId: replyPosts[3].id, type: ReactionType.LIKE },
      { actorId: emma.id, postId: flaggedPost.id, type: ReactionType.DISLIKE },
      { actorId: clara.id, postId: hiddenPost.id, type: ReactionType.DISLIKE },
    ],
  });

  await prisma.moderationVote.createMany({
    data: [
      { actorId: alice.id, postId: flaggedPost.id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: flaggedPost.id, decision: ModerationDecision.REMOVE },
      { actorId: emma.id, postId: flaggedPost.id, decision: ModerationDecision.KEEP },
      { actorId: alice.id, postId: hiddenPost.id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: hiddenPost.id, decision: ModerationDecision.REMOVE },
      { actorId: clara.id, postId: hiddenPost.id, decision: ModerationDecision.REMOVE },
      { actorId: diego.id, postId: replyPosts[4].id, decision: ModerationDecision.REMOVE },
      // Scenario 1: total 8 votes (5 remove / 3 keep) => one vote stays below 10
      { actorId: alice.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: clara.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: diego.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: emma.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.REMOVE },
      { actorId: farid.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.KEEP },
      { actorId: gina.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.KEEP },
      { actorId: hugo.id, postId: moderationScenarioPosts[0].id, decision: ModerationDecision.KEEP },
      // Scenario 2: total 9 votes (6 remove / 3 keep) => one REMOVE triggers hard delete
      { actorId: alice.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: clara.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: diego.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: emma.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: farid.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.REMOVE },
      { actorId: gina.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.KEEP },
      { actorId: hugo.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.KEEP },
      { actorId: ines.id, postId: moderationScenarioPosts[1].id, decision: ModerationDecision.KEEP },
      // Scenario 3: total 9 votes (6 keep / 3 remove) => one KEEP triggers moderation exit
      { actorId: alice.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: bob.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: clara.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: diego.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: emma.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: farid.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.KEEP },
      { actorId: gina.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.REMOVE },
      { actorId: hugo.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.REMOVE },
      { actorId: ines.id, postId: moderationScenarioPosts[2].id, decision: ModerationDecision.REMOVE },
      // Scenario 4: total 9 votes (5 remove / 4 keep) => one REMOVE triggers moderation-only hidden
      { actorId: alice.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: clara.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: diego.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: emma.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.REMOVE },
      { actorId: farid.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.KEEP },
      { actorId: gina.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.KEEP },
      { actorId: hugo.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.KEEP },
      { actorId: ines.id, postId: moderationScenarioPosts[3].id, decision: ModerationDecision.KEEP },
      // Scenario 5: total 9 votes (5 keep / 4 remove) => one KEEP keeps moderation+homepage branch at >=10
      { actorId: alice.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: bob.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: clara.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: diego.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: emma.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.KEEP },
      { actorId: farid.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.REMOVE },
      { actorId: gina.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.REMOVE },
      { actorId: hugo.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.REMOVE },
      { actorId: ines.id, postId: moderationScenarioPosts[4].id, decision: ModerationDecision.REMOVE },
      // Scenario 6: reporter-specific hide (one active REMOVE)
      { actorId: alice.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.REMOVE },
      { actorId: bob.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.KEEP },
      { actorId: clara.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.KEEP },
      { actorId: diego.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.KEEP },
      { actorId: emma.id, postId: moderationScenarioPosts[5].id, decision: ModerationDecision.KEEP },
    ],
  });
}
