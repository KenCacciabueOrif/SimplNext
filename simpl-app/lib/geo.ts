/**
 * Last updated: 2026-04-27
 * Purpose: Pure geographic math utilities for computing Haversine distance
 *          between two coordinate pairs.  No I/O dependencies — safe to use
 *          on both server and client.
 */

import type { PostListItem, ViewerLocation } from "@/lib/types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/**
 * Compute the great-circle distance in kilometres between the viewer's
 * position and a post using the Haversine formula.
 * Returns null when the post has no stored coordinates.
 */
export function calculateDistanceKm(
  viewerLocation: ViewerLocation,
  post: Pick<PostListItem, "latitude" | "longitude">,
): number | null {
  if (post.latitude === null || post.longitude === null) {
    return null;
  }

  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(post.latitude - viewerLocation.latitude);
  const longitudeDelta = toRadians(post.longitude - viewerLocation.longitude);
  const viewerLatitude = toRadians(viewerLocation.latitude);
  const postLatitude = toRadians(post.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(viewerLatitude) *
      Math.cos(postLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}
