/**
 * Last updated: 2026-04-27
 * Changes: Home tab now preserves and restores active geolocation sort context (distance mode + coordinates) instead of resetting to root URL.
 * Purpose: Render the primary navigation in the same structural position as the original Simpl app.
 */

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { buildHomeTabHref } from "@/app/components/geolocation/tabNavigation";

export default function AppTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isModeration = pathname.startsWith("/moderation");
  const homeHref = useMemo(() => buildHomeTabHref(searchParams.toString()), [searchParams]);

  return (
    <nav className="legacy-tabs" aria-label="Primary">
      <Link href={homeHref} className={!isModeration ? "is-active" : undefined}>
        Home
      </Link>
      <Link href="/moderation" className={isModeration ? "is-active" : undefined}>
        Moderation
      </Link>
    </nav>
  );
}