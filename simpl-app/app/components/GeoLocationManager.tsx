/**
 * Last updated: 2026-04-27
 * Changes: Collapsed handlePermissionStateChange and the local applyPermissionState (duplicated in effect 3) into a single useCallback; eliminated ~20 lines of identical logic.
 * Purpose: Coordinate geolocation permissions, persistence, periodic updates, and SSR refresh triggers.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import GeoFeedRefresher from "@/app/components/geolocation/GeoFeedRefresher";
import GeoIndexedDbWriter from "@/app/components/geolocation/GeoIndexedDbWriter";
import GeoPermissionWatcher from "@/app/components/geolocation/GeoPermissionWatcher";
import GeoPeriodicLocationUpdater from "@/app/components/geolocation/GeoPeriodicLocationUpdater";
import { PERMISSION_STATE_EVENT_NAME } from "@/app/components/geolocation/constants";
import { readLocationSnapshotFromIndexedDb } from "@/app/components/geolocation/locationIndexedDb";
import {
  type PermissionStateValue,
  toDisabledLocation,
  toStoredLocation,
  type ViewerLocationSnapshot,
} from "@/app/components/geolocation/types";

type RefreshRequest = {
  id: number;
  snapshot: ViewerLocationSnapshot;
};

export default function GeoLocationManager() {
  const pathname = usePathname();
  const [permissionState, setPermissionState] = useState<PermissionStateValue>("unknown");
  const [locationSnapshot, setLocationSnapshot] = useState<ViewerLocationSnapshot | null>(null);
  const [refreshRequest, setRefreshRequest] = useState<RefreshRequest | null>(null);

  const requestRefresh = useCallback((snapshot: ViewerLocationSnapshot) => {
    setRefreshRequest((previous) => ({
      id: (previous?.id ?? 0) + 1,
      snapshot,
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Shared permission state handler — used by GeoPermissionWatcher, the home-page
  // permission check effect, and the browser cache-restore reconciler.
  // ---------------------------------------------------------------------------

  const applyPermissionState = useCallback((state: PermissionStateValue) => {
    setPermissionState(state);
    window.dispatchEvent(new CustomEvent(PERMISSION_STATE_EVENT_NAME, { detail: state }));

    if (state === "denied") {
      const disabledSnapshot = toDisabledLocation();
      setLocationSnapshot(disabledSnapshot);
      requestRefresh(disabledSnapshot);
    }
  }, [requestRefresh]);

  const handleLocationUpdate = useCallback((snapshot: ViewerLocationSnapshot) => {
    setLocationSnapshot(snapshot);
    requestRefresh(snapshot);
  }, [requestRefresh]);

  const handlePermissionDeniedFromUpdater = useCallback(() => {
    setPermissionState("denied");
  }, []);

  useEffect(() => {
    if (permissionState !== "granted") {
      return;
    }

    let isMounted = true;

    void readLocationSnapshotFromIndexedDb()
      .then((snapshot) => {
        if (!isMounted || !snapshot) {
          return;
        }

        setLocationSnapshot(snapshot);
        requestRefresh(snapshot);
      })
      .catch(() => {
        // Ignore IndexedDB read errors; periodic updater will provide fresh data.
      });

    return () => {
      isMounted = false;
    };
  }, [permissionState, requestRefresh]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Route transitions can land on stale query params (e.g. back from thread).
    // Re-emit the latest known snapshot so GeoFeedRefresher can reconcile URL +
    // SSR state even when no fresh geolocation callback fired yet.
    if (locationSnapshot) {
      requestRefresh({
        ...locationSnapshot,
        updatedAt: Date.now(),
      });
    }
  }, [pathname, locationSnapshot, requestRefresh]);

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

            const snapshot = toStoredLocation(position.coords.latitude, position.coords.longitude);
            setLocationSnapshot(snapshot);
            requestRefresh(snapshot);
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
  }, [pathname, applyPermissionState, requestRefresh]);

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

    const handlePageShow = () => {
      reconcileFromBrowserState();
    };

    const handleFocus = () => {
      reconcileFromBrowserState();
    };

    const handlePopState = () => {
      reconcileFromBrowserState();
    };

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

  return (
    <>
      <GeoPermissionWatcher onStateChange={applyPermissionState} />
      <GeoPeriodicLocationUpdater
        enabled={permissionState === "granted"}
        onLocation={handleLocationUpdate}
        onPermissionDenied={handlePermissionDeniedFromUpdater}
      />
      <GeoIndexedDbWriter snapshot={locationSnapshot} />
      <GeoFeedRefresher request={refreshRequest} />
    </>
  );
}
