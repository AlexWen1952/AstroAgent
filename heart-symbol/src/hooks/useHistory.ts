'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  appendReading,
  removeReading,
  findReadingById as findById,
  subscribeToHistory,
  getHistorySnapshot,
} from '@/lib/storage';
import type { SavedReading } from '@/types/reading';

const SERVER_HISTORY: SavedReading[] = [];

/**
 * Reactive hook for reading history.
 * `history` updates automatically whenever localStorage changes (same tab or other tabs).
 */
export function useHistory() {
  const history = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    () => SERVER_HISTORY,
  );

  const saveReading = useCallback(
    (reading: SavedReading): { ok: boolean; error?: string } =>
      appendReading(reading),
    [],
  );

  const deleteReading = useCallback((id: string) => {
    removeReading(id);
  }, []);

  const findReadingById = useCallback(
    (id: string) => findById(id),
    [],
  );

  return { history, saveReading, deleteReading, findReadingById };
}
