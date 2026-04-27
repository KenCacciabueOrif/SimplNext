/**
 * Last updated: 2026-04-27
 * Purpose: Reads the last known location from IndexedDB when the viewer grants
 *   geolocation permission, then propagates it as an immediate refresh trigger.
 */

"use client";

import { useEffect } from "react";
import { readLocationSnapshotFromIndexedDb } from "@/app/components/geolocation/locationIndexedDb";
import type {
  PermissionStateValue,
  ViewerLocationSnapshot,
} from "@/app/components/geolocation/types";

export function useGeoIndexedDbSync(
  permissionState: PermissionStateValue,
  onLocationUpdate: (snapshot: ViewerLocationSnapshot) => void,
): void {
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

        onLocationUpdate(snapshot);
      })
      .catch(() => {
        // Ignore IndexedDB read errors; periodic updater will provide fresh data.
      });

    return () => {
      isMounted = false;
    };
  }, [permissionState, onLocationUpdate]);
}
