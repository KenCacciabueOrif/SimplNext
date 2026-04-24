/**
 * Last updated: 2026-04-24
 * Changes: Added periodic geolocation polling component with immediate first acquisition when enabled.
 * Purpose: Refresh viewer coordinates over time once browser geolocation permission is granted.
 */

"use client";

import { useEffect } from "react";
import { toDisabledLocation, toStoredLocation, type ViewerLocationSnapshot } from "@/app/components/geolocation/types";

type GeoPeriodicLocationUpdaterProps = {
  enabled: boolean;
  intervalMs?: number;
  onLocation: (snapshot: ViewerLocationSnapshot) => void;
  onPermissionDenied: () => void;
};

export default function GeoPeriodicLocationUpdater({
  enabled,
  intervalMs = 30_000,
  onLocation,
  onPermissionDenied,
}: GeoPeriodicLocationUpdaterProps) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    if (!("geolocation" in navigator)) {
      onLocation(toDisabledLocation());
      return;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 20_000,
      timeout: 12_000,
    };

    const requestCurrentLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onLocation(toStoredLocation(position.coords.latitude, position.coords.longitude));
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            onPermissionDenied();
            onLocation(toDisabledLocation());
          }
        },
        geoOptions,
      );
    };

    requestCurrentLocation();
    const timerId = window.setInterval(requestCurrentLocation, intervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [enabled, intervalMs, onLocation, onPermissionDenied]);

  return null;
}
