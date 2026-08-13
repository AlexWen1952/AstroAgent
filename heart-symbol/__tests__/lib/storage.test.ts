import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidSavedReading,
  parseHistory,
  sortByDateDesc,
  enforceMaxHistory,
  appendReading,
  removeReading,
  findReadingById,
  MAX_HISTORY,
  HISTORY_KEY,
} from '@/lib/storage';
import { clearSession } from '@/lib/session';
import type { SavedReading } from '@/types/reading';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeReading(id = 'test-id-1', savedAt = '2026-08-01T10:00:00.000Z'): SavedReading {
  return {
    version: 1,
    id,
    savedAt,
    input: {
      topic: 'love',
      emotion: 'anxious',
      symbolId: 'river',
      concern: 'I am feeling uncertain about my relationship.',
      locale: 'en',
      dateString: '2026-08-01',
      crisisDetected: false,
    },
    result: {
      emotionalMirror: 'Mirror text',
      symbolMeaning: 'Symbol meaning text',
      possibleBlindSpot: 'Blind spot text',
      reflectionQuestions: ['Q1', 'Q2', 'Q3'],
      oneActionForToday: 'Do one thing',
      closingLine: 'A closing line.',
      symbolMeta: {
        id: 'river',
        names: { en: 'River', zh: '河流' },
      },
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// ---------------------------------------------------------------------------
// isValidSavedReading
// ---------------------------------------------------------------------------

describe('isValidSavedReading', () => {
  it('accepts a well-formed SavedReading', () => {
    expect(isValidSavedReading(makeReading())).toBe(true);
  });

  it('accepts a record without version (backward compatibility)', () => {
    const r = makeReading() as Partial<SavedReading>;
    delete r.version;
    expect(isValidSavedReading(r)).toBe(true);
  });

  it('rejects version !== 1', () => {
    expect(isValidSavedReading({ ...makeReading(), version: 2 })).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidSavedReading(null)).toBe(false);
  });

  it('rejects a non-object primitive', () => {
    expect(isValidSavedReading('string')).toBe(false);
    expect(isValidSavedReading(42)).toBe(false);
  });

  it('rejects missing id', () => {
    const r = makeReading() as unknown as Record<string, unknown>;
    delete r.id;
    expect(isValidSavedReading(r)).toBe(false);
  });

  it('rejects empty string id', () => {
    expect(isValidSavedReading({ ...makeReading(), id: '' })).toBe(false);
  });

  it('rejects missing savedAt', () => {
    const r = makeReading() as unknown as Record<string, unknown>;
    delete r.savedAt;
    expect(isValidSavedReading(r)).toBe(false);
  });

  it('rejects missing input.topic', () => {
    const r = makeReading();
    const input = { ...r.input } as Record<string, unknown>;
    delete input.topic;
    expect(isValidSavedReading({ ...r, input })).toBe(false);
  });

  it('rejects missing input.symbolId', () => {
    const r = makeReading();
    const input = { ...r.input } as Record<string, unknown>;
    delete input.symbolId;
    expect(isValidSavedReading({ ...r, input })).toBe(false);
  });

  it('rejects missing result', () => {
    const r = makeReading() as unknown as Record<string, unknown>;
    delete r.result;
    expect(isValidSavedReading(r)).toBe(false);
  });

  it('rejects result without emotionalMirror', () => {
    const r = makeReading();
    const result = { ...r.result } as Record<string, unknown>;
    delete result.emotionalMirror;
    expect(isValidSavedReading({ ...r, result })).toBe(false);
  });

  it('rejects result without a reflectionQuestions array', () => {
    const r = makeReading();
    expect(
      isValidSavedReading({ ...r, result: { ...r.result, reflectionQuestions: 'not an array' } }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseHistory
// ---------------------------------------------------------------------------

describe('parseHistory', () => {
  it('returns [] for null input', () => {
    expect(parseHistory(null)).toEqual([]);
  });

  it('returns [] for empty string', () => {
    expect(parseHistory('')).toEqual([]);
  });

  it('returns [] for corrupted JSON', () => {
    expect(parseHistory('{not valid json')).toEqual([]);
  });

  it('returns [] when JSON root is not an array', () => {
    expect(parseHistory(JSON.stringify({ id: 'foo' }))).toEqual([]);
  });

  it('returns [] for an empty array', () => {
    expect(parseHistory('[]')).toEqual([]);
  });

  it('parses a valid array of readings', () => {
    const r1 = makeReading('a', '2026-08-02T12:00:00.000Z');
    const r2 = makeReading('b', '2026-08-01T12:00:00.000Z');
    const result = parseHistory(JSON.stringify([r1, r2]));
    expect(result).toHaveLength(2);
  });

  it('filters out individual malformed entries, keeping valid ones', () => {
    const valid = makeReading('good');
    const malformed = { id: 'bad' };
    const result = parseHistory(JSON.stringify([valid, malformed]));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('good');
  });

  it('deduplicates entries with the same ID — first occurrence wins', () => {
    const r1 = makeReading('dup', '2026-08-02T00:00:00.000Z');
    const r2 = makeReading('dup', '2026-08-01T00:00:00.000Z');
    const result = parseHistory(JSON.stringify([r1, r2]));
    expect(result).toHaveLength(1);
    expect(result[0].savedAt).toBe('2026-08-02T00:00:00.000Z');
  });

  it('preserves valid records when surrounded by malformed entries', () => {
    const valid = makeReading('ok');
    const garbage = [{ foo: 'bar' }, null, 42, valid, { x: 1 }];
    const result = parseHistory(JSON.stringify(garbage));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ok');
  });
});

// ---------------------------------------------------------------------------
// sortByDateDesc
// ---------------------------------------------------------------------------

describe('sortByDateDesc', () => {
  it('sorts newest-first', () => {
    const old = makeReading('old', '2026-07-01T00:00:00.000Z');
    const newer = makeReading('new', '2026-08-01T00:00:00.000Z');
    const result = sortByDateDesc([old, newer]);
    expect(result[0].id).toBe('new');
    expect(result[1].id).toBe('old');
  });

  it('does not mutate the original array', () => {
    const arr = [makeReading('a', '2026-07-01T00:00:00.000Z'), makeReading('b', '2026-08-01T00:00:00.000Z')];
    sortByDateDesc(arr);
    expect(arr[0].id).toBe('a');
  });

  it('handles a single element without error', () => {
    expect(sortByDateDesc([makeReading()])).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// enforceMaxHistory
// ---------------------------------------------------------------------------

describe('enforceMaxHistory', () => {
  it(`returns the array unchanged when length === ${MAX_HISTORY}`, () => {
    const arr = Array.from({ length: MAX_HISTORY }, (_, i) => makeReading(`r${i}`));
    expect(enforceMaxHistory(arr)).toHaveLength(MAX_HISTORY);
  });

  it('evicts entries beyond the limit (oldest entries at the end are removed)', () => {
    const readings = Array.from({ length: MAX_HISTORY + 1 }, (_, i) => makeReading(`r${i}`));
    const result = enforceMaxHistory(readings);
    expect(result).toHaveLength(MAX_HISTORY);
    expect(result.find((r) => r.id === `r${MAX_HISTORY}`)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// localStorage-backed: appendReading / removeReading / findReadingById
// ---------------------------------------------------------------------------

describe('appendReading', () => {
  it('returns ok:true on success', () => {
    const result = appendReading(makeReading());
    expect(result.ok).toBe(true);
  });

  it('persists the reading so findReadingById can retrieve it', () => {
    appendReading(makeReading('find-me'));
    expect(findReadingById('find-me')).toBeDefined();
    expect(findReadingById('find-me')!.id).toBe('find-me');
  });

  it('does not create a duplicate when the same ID is appended twice', () => {
    const r = makeReading('dup-test');
    appendReading(r);
    appendReading(r);
    const raw = localStorage.getItem(HISTORY_KEY)!;
    const parsed = JSON.parse(raw) as SavedReading[];
    expect(parsed.filter((x) => x.id === 'dup-test')).toHaveLength(1);
  });

  it('enforces max 50 records (FIFO — oldest evicted)', () => {
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      appendReading(makeReading(`r${i}`, new Date(2026, 0, i + 1).toISOString()));
    }
    const raw = localStorage.getItem(HISTORY_KEY)!;
    const parsed = JSON.parse(raw) as SavedReading[];
    expect(parsed.length).toBeLessThanOrEqual(MAX_HISTORY);
  });

  it('preserves the concern text exactly as stored', () => {
    const r = makeReading('concern-exact');
    r.input.concern = '  spaces at edges  ';
    appendReading(r);
    expect(findReadingById('concern-exact')!.input.concern).toBe('  spaces at edges  ');
  });

  it('preserves crisisDetected:true flag through save/load', () => {
    const r = makeReading('crisis-flag');
    r.input.crisisDetected = true;
    appendReading(r);
    expect(findReadingById('crisis-flag')!.input.crisisDetected).toBe(true);
  });
});

describe('removeReading', () => {
  it('removes a reading by ID', () => {
    appendReading(makeReading('remove-me'));
    removeReading('remove-me');
    expect(findReadingById('remove-me')).toBeUndefined();
  });

  it('does not throw when the ID does not exist', () => {
    expect(() => removeReading('ghost-id')).not.toThrow();
  });

  it('does not affect other readings when removing one', () => {
    appendReading(makeReading('keep'));
    appendReading(makeReading('delete'));
    removeReading('delete');
    expect(findReadingById('keep')).toBeDefined();
    expect(findReadingById('delete')).toBeUndefined();
  });

  it('is idempotent — repeated calls do not crash', () => {
    appendReading(makeReading('double-delete'));
    expect(() => {
      removeReading('double-delete');
      removeReading('double-delete');
    }).not.toThrow();
  });
});

describe('findReadingById', () => {
  it('returns undefined for an unknown ID', () => {
    expect(findReadingById('does-not-exist')).toBeUndefined();
  });

  it('returns undefined on empty history', () => {
    expect(findReadingById('anything')).toBeUndefined();
  });

  it('does not crash on corrupted localStorage data', () => {
    localStorage.setItem(HISTORY_KEY, '{corrupted');
    expect(() => findReadingById('any')).not.toThrow();
    expect(findReadingById('any')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Reading regeneration from a saved record in both locales
// ---------------------------------------------------------------------------

describe('regeneration in both locales from a saved record', () => {
  it('produces non-empty output in EN and ZH', async () => {
    const { generateReading } = await import('@/lib/readingEngine');
    const savedInput = {
      topic: 'career' as const,
      emotion: 'hopeful' as const,
      symbolId: 'moon' as const,
      concern: 'I want to grow in my career.',
      locale: 'en' as const,
      dateString: '2026-08-01',
    };
    const enReading = generateReading({ ...savedInput, locale: 'en' });
    const zhReading = generateReading({ ...savedInput, locale: 'zh' });

    expect(enReading.emotionalMirror.length).toBeGreaterThan(0);
    expect(zhReading.emotionalMirror.length).toBeGreaterThan(0);
    expect(enReading.emotionalMirror).not.toBe(zhReading.emotionalMirror);
    expect(enReading.symbolMeta.names.en).toBe('Moon');
    expect(zhReading.symbolMeta.names.zh).toBe('月');
  });

  it('does not mutate the saved input when regenerating in a different locale', async () => {
    const { generateReading } = await import('@/lib/readingEngine');
    const savedInput = {
      topic: 'self' as const,
      emotion: 'sad' as const,
      symbolId: 'seed' as const,
      concern: 'I feel lost.',
      locale: 'en' as const,
      dateString: '2026-08-01',
    };
    const inputCopy = { ...savedInput };
    generateReading({ ...savedInput, locale: 'zh' });
    expect(savedInput.locale).toBe(inputCopy.locale);
  });

  it('preserves crisisDetected flag through regeneration', async () => {
    const { generateReading } = await import('@/lib/readingEngine');
    const input = {
      topic: 'love' as const,
      emotion: 'anxious' as const,
      symbolId: 'river' as const,
      concern: 'something painful',
      locale: 'en' as const,
      dateString: '2026-08-01',
      crisisDetected: true,
    };
    const r = makeReading('crisis-regen');
    r.input = input;
    appendReading(r);
    const found = findReadingById('crisis-regen')!;
    expect(found.input.crisisDetected).toBe(true);
    const result = generateReading({ ...found.input, locale: 'zh' });
    expect(result.emotionalMirror.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Start-new: clearSession does not touch localStorage history
// ---------------------------------------------------------------------------

describe('start-new behavior', () => {
  it('clearSession leaves localStorage history intact', () => {
    appendReading(makeReading('survives-session-clear'));
    sessionStorage.setItem('heart-symbol-session', JSON.stringify({ version: 1, step: 'reading', dateString: '2026-08-01', locale: 'en' }));

    clearSession();

    expect(sessionStorage.getItem('heart-symbol-session')).toBeNull();
    expect(findReadingById('survives-session-clear')).toBeDefined();
  });
});
