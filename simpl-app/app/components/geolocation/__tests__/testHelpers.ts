/**
 * Last updated: 2026-04-27
 * Purpose: Shared test utilities for geolocation module tests.
 *          Provides a localStorage mock that can be installed into the global
 *          scope before each test so browser-storage helpers work in the
 *          Node/Vitest environment without a real DOM.
 */

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

/**
 * Install a Map-backed localStorage mock onto globalThis.
 * Call this in a beforeEach so each test starts with an isolated store.
 * Follow up with `localStorage.clear()` inside the same beforeEach to ensure
 * residual items from previous test runs cannot bleed across.
 */
export function installMockLocalStorage() {
  const store = new Map<string, string>();

  const localStorageMock = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  } satisfies Storage;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
  });
}
