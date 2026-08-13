'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateAINarrative, checkAIAvailability } from '@/lib/aiNarrative';
import type { ReadingInput, ReadingResult, AIReadingResult } from '@/types/reading';

export type AIStatus =
  | 'checking'    // probing /api/ai-narrative GET
  | 'available'   // API key present; ready to personalize
  | 'unavailable' // no API key configured
  | 'loading'     // POST in flight
  | 'done'        // narrative ready
  | 'error';      // generation failed (transient — can retry)

interface UseAINarrativeResult {
  status: AIStatus;
  narrative: AIReadingResult | null;
  /**
   * Request a personalized narrative.
   *
   * Safe to call at any time:
   * - no-op if a request is already in flight
   * - cancels any previous in-flight request and re-fetches if status is
   *   'done' (e.g. after a locale change invalidated the cached narrative)
   * - clears the previous narrative while loading so the UI does not show
   *   stale content
   */
  personalize: () => void;
}

export function useAINarrative(
  input: ReadingInput | null,
  deterministicResult: ReadingResult | null,
): UseAINarrativeResult {
  const [status, setStatus] = useState<AIStatus>('checking');
  const [narrative, setNarrative] = useState<AIReadingResult | null>(null);

  /**
   * Holds the AbortController for the currently in-flight personalise request.
   * A ref is used so the cleanup effect always sees the latest controller
   * without needing it as a dependency.
   */
  const abortCtrlRef = useRef<AbortController | null>(null);

  // Probe availability once on mount.
  useEffect(() => {
    let cancelled = false;
    checkAIAvailability().then((available) => {
      if (!cancelled) setStatus(available ? 'available' : 'unavailable');
    });
    return () => { cancelled = true; };
  }, []);

  // Abort any in-flight request when the component unmounts.
  useEffect(() => {
    return () => { abortCtrlRef.current?.abort(); };
  }, []);

  const personalize = useCallback(async () => {
    if (!input || !deterministicResult) return;
    // Prevent a second simultaneous request; re-fetch is allowed in all other states.
    if (status === 'loading') return;

    // Abort any previous in-flight request (e.g. a re-personalize after locale change).
    abortCtrlRef.current?.abort();
    const ctrl = new AbortController();
    abortCtrlRef.current = ctrl;

    // Clear the previous narrative immediately so stale content is not shown
    // while the new request is in flight.
    setNarrative(null);
    setStatus('loading');

    const result = await generateAINarrative(input, deterministicResult, { signal: ctrl.signal });

    // If this request was superseded by a newer one, discard the result silently.
    if (ctrl.signal.aborted) return;

    if (result.ok) {
      setNarrative(result.narrative);
      setStatus('done');
    } else if (result.reason === 'no-api-key') {
      setStatus('unavailable');
    } else if (result.reason === 'aborted') {
      // Aborted externally — reset quietly to 'available' so the user can retry.
      setStatus('available');
    } else {
      setStatus('error');
    }
  }, [input, deterministicResult, status]);

  return { status, narrative, personalize };
}
