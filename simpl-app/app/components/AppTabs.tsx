/**
 * Last updated: 2026-04-21
 * Changes: Added the legacy-style Home/Moderation tab bar with active state styling.
 * Purpose: Render the primary navigation in the same structural position as the original Simpl app.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppTabs() {
  const pathname = usePathname();
  const isModeration = pathname.startsWith("/moderation");

  return (
    <nav className="legacy-tabs" aria-label="Primary">
      <Link href="/" className={!isModeration ? "is-active" : undefined}>
        Home
      </Link>
      <Link href="/moderation" className={isModeration ? "is-active" : undefined}>
        Moderation
      </Link>
    </nav>
  );
}