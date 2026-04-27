/**
 * Last updated: 2026-04-27
 * Changes: Extracted 4 useEffect blocks into dedicated hooks (useGeoIndexedDbSync,
 *   useGeoRouteRefresh, useGeoPagePermissionCheck, useGeoVisibilityReconciler).
 * Purpose: Coordinate geolocation permissions, persistence, periodic updates, and SSR refresh triggers.
 */

"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import GeoFeedRefresher from "@/app/components/geolocation/GeoFeedRefresher";
import GeoIndexedDbWriter from "@/app/components/geolocation/GeoIndexedDbWriter";
import GeoPermissionWatcher from "@/app/components/geolocation/GeoPermissionWatcher";
import GeoPeriodicLocationUpdater from "@/app/components/geolocation/GeoPeriodicLocationUpdater";
import { PERMISSION_STATE_EVENT_NAME } from "@/app/components/geolocation/constants";
import { useGeoIndexedDbSync } from "@/app/components/geolocation/useGeoIndexedDbSync";
import { useGeoPagePermissionCheck } from "@/app/components/geolocation/useGeoPagePermissionCheck";
import { useGeoRouteRefresh } from "@/app/components/geolocation/useGeoRouteRefresh";
import { useGeoVisibilityReconciler } from "@/app/components/geolocation/useGeoVisibilityReconciler";
import {
  type PermissionStateValue,
  toDisabledLocation,
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

  useGeoIndexedDbSync(permissionState, handleLocationUpdate);
  useGeoRouteRefresh(pathname, locationSnapshot, requestRefresh);
  useGeoPagePermissionCheck(pathname, applyPermissionState, handleLocationUpdate);
  useGeoVisibilityReconciler(locationSnapshot, applyPermissionState, requestRefresh);

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
