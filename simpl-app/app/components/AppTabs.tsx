/**
 * Last updated: 2026-04-27
 * Changes: Phase D — added aria-current="page" to the active tab link alongside the existing is-active class.
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
      <Link
        href={homeHref}
        className={!isModeration ? "is-active" : undefined}
        aria-current={!isModeration ? "page" : undefined}
      >
        Home
      </Link>
      <Link
        href="/moderation"
        className={isModeration ? "is-active" : undefined}
        aria-current={isModeration ? "page" : undefined}
      >
        Moderation
      </Link>
    </nav>
  );
}