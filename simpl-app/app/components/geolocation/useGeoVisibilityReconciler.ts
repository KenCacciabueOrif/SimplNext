/**
 * Last updated: 2026-04-27
 * Purpose: Reconciles geolocation permission state and the last known location
 *   snapshot whenever the page regains visibility (pageshow, visibilitychange,
 *   focus, popstate). Keeps SSR state in sync after the tab was backgrounded.
 */

"use client";

import { useEffect } from "react";
import type {
  PermissionStateValue,
  ViewerLocationSnapshot,
} from "@/app/components/geolocation/types";

export function useGeoVisibilityReconciler(
  locationSnapshot: ViewerLocationSnapshot | null,
  applyPermissionState: (state: PermissionStateValue) => void,
  requestRefresh: (snapshot: ViewerLocationSnapshot) => void,
): void {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reconcileFromBrowserState = () => {
      if (!navigator.permissions?.query) {
        return;
      }

      void navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((permissionStatus) => {
          const state = permissionStatus.state as PermissionStateValue;

          applyPermissionState(state);

          if (state === "granted" && locationSnapshot) {
            requestRefresh({
              ...locationSnapshot,
              updatedAt: Date.now(),
            });
          }
        })
        .catch(() => {
          // Keep current state when permission query fails.
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        reconcileFromBrowserState();
      }
    };

    const handlePageShow = () => { reconcileFromBrowserState(); };
    const handleFocus = () => { reconcileFromBrowserState(); };
    const handlePopState = () => { reconcileFromBrowserState(); };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [locationSnapshot, applyPermissionState, requestRefresh]);
}
