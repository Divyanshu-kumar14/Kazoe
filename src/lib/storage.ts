const STORAGE_VERSION = 1;

interface VersionedWrapper {
  version: number;
  data: unknown;
}

/**
 * Load a value from localStorage with automatic versioned wrapper support.
 *
 * Legacy unversioned values (written without the wrapper) are still read
 * correctly — they're returned as-is at the current version.
 *
 * When schema changes are needed, increment `STORAGE_VERSION` and add
 * migration logic here. Example:
 *
 * ```
 * if (wrapper.version < 2) {
 *   wrapper.data = migrateV1toV2(wrapper.data);
 * }
 * ```
 */
export function loadItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;

    const parsed = JSON.parse(raw);

    // Versioned wrapper format: { version: number, data: T }
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.version === 'number' &&
      'data' in parsed
    ) {
      return parsed.data as T;
    }

    // Legacy unversioned format — interpret as-is
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Save a value to localStorage wrapped with the current schema version.
 * Future readers can use the version number to run migrations.
 */
export function saveItem<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  const wrapper: VersionedWrapper = { version: STORAGE_VERSION, data };
  localStorage.setItem(key, JSON.stringify(wrapper));
}
