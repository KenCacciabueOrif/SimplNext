/*
 * Last updated: 2026-04-27
 * Changes: Hardened fetch strategy to always return a valid Response and avoid undefined respondWith() values.
 * Purpose: Provide safe runtime caching for same-origin GET requests without breaking page reloads.
 */

const CACHE_NAME = 'simpl-runtime-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkThenCache(request) {
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests to avoid interfering with mutations.
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        return await networkThenCache(request);
      } catch {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        // Always return a Response object so respondWith never receives undefined.
        return new Response('Offline content unavailable.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })(),
  );
});