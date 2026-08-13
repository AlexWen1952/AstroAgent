import type { ReadingInput, ReadingResult, AIReadingResult } from '@/types/reading';

/**
 * Validates that an unknown value matches the AIReadingResult shape.
 * Exported for unit testing.
 *
 * Note: this client-side guard checks structure and non-empty fields only.
 * The stricter server-side checks (min length, locale consistency, prohibited
 * content) run inside the route handler before the response is sent.
 */
export function isValidAIReadingResult(value: unknown): value is AIReadingResult {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  const requiredStrings = [
    'emotionalMirror',
    'symbolMeaning',
    'possibleBlindSpot',
    'oneActionForToday',
    'closingLine',
    'locale',
  ] as const;

  for (const key of requiredStrings) {
    if (typeof v[key] !== 'string' || !v[key]) return false;
  }

  const qs = v['reflectionQuestions'];
  return (
    Array.isArray(qs) &&
    qs.length === 3 &&
    qs.every((q) => typeof q === 'string' && q.length > 0)
  );
}

export type GenerateResultReason =
  | 'no-api-key'
  | 'network-error'
  | 'invalid-response'
  | 'timeout'
  | 'aborted'
  | 'error';

export type GenerateResult =
  | { ok: true; narrative: AIReadingResult }
  | { ok: false; reason: GenerateResultReason };

/**
 * Sends the deterministic reading to the server-side AI route and returns a
 * personalized narrative, or an error descriptor.
 *
 * The API key is NEVER exposed to the client — it lives only in the
 * Next.js server environment and is accessed through /api/ai-narrative.
 *
 * Pass `signal` from an AbortController to cancel an in-flight request (e.g.
 * when the component unmounts or the user changes locale).
 *
 * Returns `{ ok: false }` instead of throwing, so callers can fall back to
 * the deterministic reading gracefully.
 */
export async function generateAINarrative(
  input: ReadingInput,
  deterministicResult: ReadingResult,
  options?: { signal?: AbortSignal },
): Promise<GenerateResult> {
  try {
    const response = await fetch('/api/ai-narrative', {
      method: 'POST',
      signal: options?.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, result: deterministicResult }),
    });

    if (!response.ok) {
      return { ok: false, reason: 'error' };
    }

    const data = (await response.json()) as {
      ok: boolean;
      reason?: string;
      narrative?: unknown;
    };

    if (!data.ok) {
      if (data.reason === 'no-api-key') return { ok: false, reason: 'no-api-key' };
      if (data.reason === 'timeout') return { ok: false, reason: 'timeout' };
      return { ok: false, reason: 'error' };
    }

    if (!isValidAIReadingResult(data.narrative)) {
      return { ok: false, reason: 'invalid-response' };
    }

    return { ok: true, narrative: data.narrative };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, reason: 'aborted' };
    }
    return { ok: false, reason: 'network-error' };
  }
}

/**
 * Probes whether the AI narrative feature is available on this deployment.
 * Returns false on any network failure so callers can hide the feature gracefully.
 */
export async function checkAIAvailability(): Promise<boolean> {
  try {
    const res = await fetch('/api/ai-narrative', { method: 'GET' });
    if (!res.ok) return false;
    const data = (await res.json()) as { available?: boolean };
    return data.available === true;
  } catch {
    return false;
  }
}
