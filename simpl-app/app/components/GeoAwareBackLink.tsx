/**
 * Last updated: 2026-04-27
 * Changes: Hardened back-link geo restoration by reusing the persisted location snapshot even when the activity marker is temporarily stale.
 * Purpose: Keep feed/thread back navigation aligned with active distance sorting after returning from comments.
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ensureGeoQuery } from "@/app/components/geolocation/backLinkNavigation";

type GeoAwareBackLinkProps = {
  fallbackHref: string;
  className?: string;
  children: React.ReactNode;
};

export default function GeoAwareBackLink({ fallbackHref, className, children }: GeoAwareBackLinkProps) {
  const searchParams = useSearchParams();
  const [href, setHref] = useState(fallbackHref);

  useEffect(() => {
    const parsedFallback = new URL(fallbackHref, window.location.origin);
    const mergedParams = new URLSearchParams(parsedFallback.search);

    // Keep explicit query context from the current URL whenever available.
    for (const [key, value] of searchParams.entries()) {
      mergedParams.set(key, value);
    }

    setHref(ensureGeoQuery(parsedFallback.pathname, mergedParams));
  }, [fallbackHref, searchParams]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
