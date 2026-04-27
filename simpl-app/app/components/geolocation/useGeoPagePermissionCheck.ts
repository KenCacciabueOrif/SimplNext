/**
 * Last updated: 2026-04-27
 * Purpose: On the home page, queries permission state via the Permissions API and
 *   fires an immediate getCurrentPosition call when already granted, so the first
 *   render gets fresh coordinates without waiting for the periodic updater.
 */

"use client";

import { useEffect } from "react";
import {
  toStoredLocation,
  type PermissionStateValue,
  type ViewerLocationSnapshot,
} from "@/app/components/geolocation/types";

export function useGeoPagePermissionCheck(
  pathname: string,
  applyPermissionState: (state: PermissionStateValue) => void,
  onLocationUpdate: (snapshot: ViewerLocationSnapshot) => void,
): void {
  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/") {
      return;
    }

    if (!navigator.permissions?.query) {
      // Without Permissions API we cannot safely infer authorization without
      // triggering a prompt; keep current state and rely on explicit user action.
      return;
    }

    let isMounted = true;

    void navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((permissionStatus) => {
        const state = permissionStatus.state as PermissionStateValue;

        if (!isMounted) {
          return;
        }

        applyPermissionState(state);

        if (state !== "granted" || !("geolocation" in navigator)) {
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted) {
              return;
            }

            onLocationUpdate(
              toStoredLocation(position.coords.latitude, position.coords.longitude),
            );
          },
          () => {
            // If this fails, periodic updater and stored snapshot refresh still run.
          },
          {
            enableHighAccuracy: true,
            maximumAge: 20_000,
            timeout: 12_000,
          },
        );
      })
      .catch(() => {
        // Keep existing state if permission re-check fails.
      });

    return () => {
      isMounted = false;
    };
  }, [pathname, applyPermissionState, onLocationUpdate]);
}
