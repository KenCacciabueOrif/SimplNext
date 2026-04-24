/**
 * Last updated: 2026-04-24
 * Changes: Added IndexedDB helpers to read and write geolocation snapshots in a dedicated browser store.
 * Purpose: Persist viewer location independently from URL state and survive navigation/reload cycles.
 */

import {
  LOCATION_INDEXED_DB_KEY,
  LOCATION_INDEXED_DB_NAME,
  LOCATION_INDEXED_DB_STORE,
  LOCATION_INDEXED_DB_VERSION,
} from "@/app/components/geolocation/constants";
import type { ViewerLocationSnapshot } from "@/app/components/geolocation/types";

function getOpenDbPromise() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = window.indexedDB.open(LOCATION_INDEXED_DB_NAME, LOCATION_INDEXED_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(LOCATION_INDEXED_DB_STORE)) {
        db.createObjectStore(LOCATION_INDEXED_DB_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open geolocation IndexedDB."));
  });
}

export async function readLocationSnapshotFromIndexedDb() {
  const db = await getOpenDbPromise();

  try {
    return await new Promise<ViewerLocationSnapshot | null>((resolve, reject) => {
      const transaction = db.transaction(LOCATION_INDEXED_DB_STORE, "readonly");
      const store = transaction.objectStore(LOCATION_INDEXED_DB_STORE);
      const request = store.get(LOCATION_INDEXED_DB_KEY);

      request.onsuccess = () => {
        const value = request.result as ViewerLocationSnapshot | undefined;
        resolve(value ?? null);
      };

      request.onerror = () => reject(request.error ?? new Error("Failed to read geolocation snapshot."));
    });
  } finally {
    db.close();
  }
}

export async function writeLocationSnapshotToIndexedDb(snapshot: ViewerLocationSnapshot) {
  const db = await getOpenDbPromise();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(LOCATION_INDEXED_DB_STORE, "readwrite");
      const store = transaction.objectStore(LOCATION_INDEXED_DB_STORE);
      store.put(snapshot, LOCATION_INDEXED_DB_KEY);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Failed to write geolocation snapshot."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Geolocation write transaction aborted."));
    });
  } finally {
    db.close();
  }
}
