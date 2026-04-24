/**
 * Last updated: 2026-04-24
 * Changes: Added IndexedDB writer component that persists the latest geolocation snapshot after updates.
 * Purpose: Persist location snapshots in browser IndexedDB whenever orchestration state changes.
 */

"use client";

import { useEffect, useRef } from "react";
import { writeLocationSnapshotToIndexedDb } from "@/app/components/geolocation/locationIndexedDb";
import type { ViewerLocationSnapshot } from "@/app/components/geolocation/types";

type GeoIndexedDbWriterProps = {
  snapshot: ViewerLocationSnapshot | null;
};

export default function GeoIndexedDbWriter({ snapshot }: GeoIndexedDbWriterProps) {
  const lastWrittenRef = useRef<string>("");

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const serialized = JSON.stringify(snapshot);

    if (serialized === lastWrittenRef.current) {
      return;
    }

    lastWrittenRef.current = serialized;

    void writeLocationSnapshotToIndexedDb(snapshot).catch(() => {
      // IndexedDB write failures should not block navigation refresh.
    });
  }, [snapshot]);

  return null;
}
