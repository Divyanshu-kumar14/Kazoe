import '@testing-library/jest-dom';

/**
 * Mock localStorage and sessionStorage for jsdom.
 *
 * Node.js ≥22 provides an experimental global localStorage that conflicts
 * with jsdom's implementation and requires the --localstorage-file flag.
 * We override with a simple Map-based shim to stay compatible regardless
 * of Node version.
 */
function createStorageShim(): Storage {
  const store = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      store.set(String(key), String(value));
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    clear(): void {
      store.clear();
    },
    get length(): number {
      return store.size;
    },
    key(index: number): string | null {
      const keys = [...store.keys()];
      return keys[index] ?? null;
    },
  };
}

if (typeof localStorage === 'undefined' || localStorage === null) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorageShim(),
    configurable: true,
    writable: true,
  });
}

if (typeof sessionStorage === 'undefined' || sessionStorage === null) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createStorageShim(),
    configurable: true,
    writable: true,
  });
}

/**
 * Polyfill window.matchMedia — jsdom does not provide it.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    configurable: true,
    writable: true,
  });
}
