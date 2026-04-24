/**
 * Last updated: 2026-04-24
 * Changes: Added a dedicated permission-state watcher that emits browser geolocation policy transitions. Permission prompting is now passive: no automatic geolocation request is fired on load, and the consent dialog is only triggered by explicit user action from the UI. Kept periodic permission re-check fallback for browsers with inconsistent change events.
 * Purpose: Isolate browser permission handling from location acquisition and feed-refresh logic.
 */

"use client";

import { useEffect } from "react";
import type { PermissionStateValue } from "@/app/components/geolocation/types";

type GeoPermissionWatcherProps = {
  onStateChange: (state: PermissionStateValue) => void;
};

export default function GeoPermissionWatcher({ onStateChange }: GeoPermissionWatcherProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("geolocation" in navigator)) {
      onStateChange("denied");
      return;
    }

    if (!navigator.permissions?.query) {
      // Without Permissions API, do not auto-prompt on load; keep a passive
      // prompt state until the user explicitly requests geolocation.
      onStateChange("prompt");
      return;
    }

    let isMounted = true;
    let reconcileTimer: number | null = null;
    let removeListener: (() => void) | null = null;

    void navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((permissionStatus) => {
        if (!isMounted) {
          return;
        }

        const emitState = () => {
          const state = permissionStatus.state as PermissionStateValue;
          onStateChange(state);
        };

        emitState();

        permissionStatus.addEventListener("change", emitState);
        removeListener = () => permissionStatus.removeEventListener("change", emitState);

        // Fallback for browsers where PermissionStatus.change can be flaky.
        reconcileTimer = window.setInterval(() => {
          void navigator.permissions
            .query({ name: "geolocation" as PermissionName })
            .then((latestStatus) => {
              if (!isMounted) {
                return;
              }

              const state = latestStatus.state as PermissionStateValue;
              onStateChange(state);
            })
            .catch(() => {
              // Keep current state if reconciliation fails.
            });
        }, 5000);
      })
      .catch(() => {
        onStateChange("unknown");
      });

    return () => {
      isMounted = false;

      if (reconcileTimer !== null) {
        window.clearInterval(reconcileTimer);
      }

      if (removeListener) {
        removeListener();
      }
    };
  }, [onStateChange]);

  return null;
}
