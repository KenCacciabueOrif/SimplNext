/**
 * Last updated: 2026-04-24
 * Changes: Reused shared geolocation browser-state parsers to remove duplicated snapshot and sort-mode normalization logic.
 * Purpose: Render the create form shared by the new post page and thread reply flow.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { createPostAction } from "@/app/actions";
import {
  normalizeSortMode,
  parseLocationSnapshot,
} from "@/app/components/geolocation/browserState";
import { LOCATION_EVENT_NAME, LOCATION_STORAGE_KEY } from "@/app/components/geolocation/constants";
import { readLocationSnapshotFromIndexedDb } from "@/app/components/geolocation/locationIndexedDb";
import type { ViewerLocationSnapshot } from "@/app/components/geolocation/types";

type PostComposerProps = {
  heading: string;
  submitLabel: string;
  description: string;
  parentId?: string;
};

export default function PostComposer({
  heading,
  submitLabel,
  description,
  parentId,
}: PostComposerProps) {
  const searchParams = useSearchParams();
  const [locationSnapshot, setLocationSnapshot] = useState<ViewerLocationSnapshot | null>(null);

  useEffect(() => {
    const fromStorage = parseLocationSnapshot(localStorage.getItem(LOCATION_STORAGE_KEY));

    if (fromStorage) {
      setLocationSnapshot(fromStorage);
    }

    void readLocationSnapshotFromIndexedDb()
      .then((fromIndexedDb) => {
        if (fromIndexedDb) {
          setLocationSnapshot(fromIndexedDb);
        }
      })
      .catch(() => {
        // Keep localStorage/event fallback when IndexedDB is unavailable.
      });

    function handleLocationUpdate(event: Event) {
      const customEvent = event as CustomEvent<ViewerLocationSnapshot>;
      setLocationSnapshot(customEvent.detail ?? null);
    }

    window.addEventListener(LOCATION_EVENT_NAME, handleLocationUpdate);

    return () => {
      window.removeEventListener(LOCATION_EVENT_NAME, handleLocationUpdate);
    };
  }, []);

  const latitudeValue = useMemo(() => {
    if (!locationSnapshot?.active || locationSnapshot.latitude === null) {
      return "";
    }

    return locationSnapshot.latitude.toFixed(6);
  }, [locationSnapshot]);

  const longitudeValue = useMemo(() => {
    if (!locationSnapshot?.active || locationSnapshot.longitude === null) {
      return "";
    }

    return locationSnapshot.longitude.toFixed(6);
  }, [locationSnapshot]);

  const navigationQueryValue = useMemo(() => {
    const merged = new URLSearchParams(searchParams.toString());

    const popularity = normalizeSortMode(merged.get("popularity"));
    const date = normalizeSortMode(merged.get("date"));
    const distance = normalizeSortMode(merged.get("distance"));

    if (popularity) {
      merged.set("popularity", popularity);
    } else {
      merged.delete("popularity");
    }

    if (date) {
      merged.set("date", date);
    } else {
      merged.delete("date");
    }

    if (locationSnapshot?.active && locationSnapshot.latitude !== null && locationSnapshot.longitude !== null) {
      merged.set("lat", locationSnapshot.latitude.toFixed(6));
      merged.set("lng", locationSnapshot.longitude.toFixed(6));
      merged.set("geo", "on");

      if (!distance) {
        merged.set("distance", "down");
      }
    } else {
      merged.delete("lat");
      merged.delete("lng");

      if (merged.get("geo") !== "on") {
        merged.set("geo", "off");
      }
    }

    const normalizedDistance = normalizeSortMode(merged.get("distance"));

    if (normalizedDistance) {
      merged.set("distance", normalizedDistance);
    } else {
      merged.delete("distance");
    }

    return merged.toString();
  }, [locationSnapshot, searchParams]);

  return (
    <section className="composer-card">
      <div className="panel-title">
        <h2>{heading}</h2>
        <p>{description}</p>
        <p className="composer-location-status">
          {locationSnapshot?.active && latitudeValue && longitudeValue
            ? `Position active: ${latitudeValue}, ${longitudeValue}`
            : "Position inactive: le post/commentaire sera enregistré sans coordonnées."}
        </p>
      </div>

      <form action={createPostAction}>
        {parentId ? <input type="hidden" name="parentId" value={parentId} /> : null}
        <input type="hidden" name="navigationQuery" value={navigationQueryValue} />
        <input type="hidden" name="latitude" value={latitudeValue} />
        <input type="hidden" name="longitude" value={longitudeValue} />

        <label className="field">
          <span>Titre</span>
          <input name="title" placeholder="Résume l’idée principale" required type="text" />
        </label>

        <label className="field">
          <span>Message</span>
          <textarea
            name="body"
            placeholder="Décris le sujet, le besoin ou la proposition."
            required
          />
        </label>

        <div className="button-row">
          <button className="button" type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}