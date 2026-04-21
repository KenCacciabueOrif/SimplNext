/**
 * Last updated: 2026-04-21
 * Changes: Redirected the legacy listing route to the main Simpl feed.
 * Purpose: Keep `/posts` as a compatible entry point while the feed lives on `/`.
 */

import { redirect } from "next/navigation";

export default function PostsPage() {
  redirect("/");
}