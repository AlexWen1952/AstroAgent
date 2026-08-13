import type { SavedReading } from '@/types/reading';

export const HISTORY_KEY = 'heart-symbol-history';
export const MAX_HISTORY = 50;

/**
 * Custom event dispatched within the same tab after any write to localStorage history.
 * Combined with the native 'storage' event (which fires in other tabs), this enables
 * cross-component and cross-tab reactive updates via useSyncExternalStore.
 */
export const HISTORY_CHANGE_EVENT = 'heart-symbol-history-change';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Runtime type guard for a SavedReading record.
 * Checks essential structural fields without deep-validating every nested string,
 * so valid entries that may have minor cosmetic differences still pass.
 * Tolerates missing `version` for backward compatibility with records saved before
 * the version field was introduced.
 */
export function isValidSavedReading(entry: unknown): entry is SavedReading {
  if (!entry || typeof entry !== 'object') return false;
  const r = entry as Record<string, unknown>;

  if (typeof r.id !== 'string' || r.id.length === 0) return false;
  if (typeof r.savedAt !== 'string' || r.savedAt.length === 0) return false;
  if (r.version !== undefined && r.version !== 1) return false;

  if (!r.input || typeof r.input !== 'object') return false;
  const input = r.input as Record<string, unknown>;
  if (typeof input.topic !== 'string') return false;
  if (typeof input.emotion !== 'string') return false;
  if (typeof input.symbolId !== 'string') return false;
  if (typeof input.concern !== 'string') return false;
  if (typeof input.dateString !== 'string') return false;
  if (typeof input.locale !== 'string') return false;

  if (!r.result || typeof r.result !== 'object') return false;
  const result = r.result as Record<string, unknown>;
  if (typeof result.emotionalMirror !== 'string') return false;
  if (!Array.isArray(result.reflectionQuestions)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Pure transformation functions (no browser APIs)
// ---------------------------------------------------------------------------

/**
 * Parse a raw JSON string from localStorage into a validated array of SavedReadings.
 * Corrupted JSON returns [].
 * Individual malformed entries are silently filtered out.
 * Duplicate IDs are deduplicated (first occurrence wins).
 */
export function parseHistory(raw: string | null): SavedReading[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  return parsed.filter((entry): entry is SavedReading => {
    if (!isValidSavedReading(entry)) return false;
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

/**
 * Sort an array of SavedReadings by savedAt descending (newest first).
 * Returns a new array; the original is not mutated.
 */
export function sortByDateDesc(readings: SavedReading[]): SavedReading[] {
  return [...readings].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

/**
 * Enforce the maximum history size.
 * Assumes the array is already sorted newest-first; removes from the end (oldest).
 */
export function enforceMaxHistory(readings: SavedReading[]): SavedReading[] {
  return readings.length > MAX_HISTORY ? readings.slice(0, MAX_HISTORY) : readings;
}

// ---------------------------------------------------------------------------
// localStorage read/write (browser only)
// ---------------------------------------------------------------------------

/**
 * Read and validate all saved readings from localStorage.
 * Returns [] on SSR, on parse error, or when no data exists.
 */
export function readHistory(): SavedReading[] {
  if (typeof window === 'undefined') return [];
  try {
    return parseHistory(localStorage.getItem(HISTORY_KEY));
  } catch {
    return [];
  }
}

/**
 * Write the given array to localStorage and notify all subscribers.
 */
function writeHistory(readings: SavedReading[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(readings));
  window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
}

/**
 * Prepend a new reading, deduplicate by ID, and enforce the 50-record limit.
 * Oldest records are evicted first (FIFO).
 */
export function appendReading(reading: SavedReading): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') return { ok: false, error: 'unavailable' };
  try {
    const existing = readHistory();
    const withoutDupe = existing.filter((r) => r.id !== reading.id);
    const updated = enforceMaxHistory([reading, ...withoutDupe]);
    writeHistory(updated);
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { ok: false, error: 'full' };
    }
    return { ok: false, error: 'unavailable' };
  }
}

/**
 * Remove a single reading by ID. No-op if the ID does not exist.
 */
export function removeReading(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = readHistory().filter((r) => r.id !== id);
    writeHistory(updated);
  } catch {
    // Ignore write errors; the record may already be deleted.
  }
}

/**
 * Find a single reading by ID. Returns undefined if not found or on error.
 */
export function findReadingById(id: string): SavedReading | undefined {
  return readHistory().find((r) => r.id === id);
}

// ---------------------------------------------------------------------------
// useSyncExternalStore adapters
// ---------------------------------------------------------------------------

/**
 * Subscribe to history changes from both the same tab (HISTORY_CHANGE_EVENT)
 * and other tabs (native 'storage' event).
 */
export function subscribeToHistory(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onChange);
  window.addEventListener(HISTORY_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(HISTORY_CHANGE_EVENT, onChange);
  };
}

/**
 * Snapshot cache — stores the last raw JSON string and its parsed result.
 * useSyncExternalStore compares snapshot references with Object.is().
 * Returning the same array reference when the raw content is unchanged
 * prevents unnecessary re-renders.
 */
let _snapshotRaw: string | null = undefined as unknown as null;
let _snapshotResult: SavedReading[] = [];

/** Client snapshot for useSyncExternalStore. */
export function getHistorySnapshot(): SavedReading[] {
  if (typeof window === 'undefined') return [];
  let raw: string | null;
  try {
    raw = localStorage.getItem(HISTORY_KEY);
  } catch {
    return _snapshotResult;
  }
  if (raw === _snapshotRaw) return _snapshotResult;
  _snapshotRaw = raw;
  _snapshotResult = parseHistory(raw);
  return _snapshotResult;
}
