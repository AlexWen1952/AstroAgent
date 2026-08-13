import { describe, it, expect, vi, afterEach } from 'vitest';
import { isValidAIReadingResult, generateAINarrative } from '@/lib/aiNarrative';
import type { AIReadingResult } from '@/types/reading';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const validNarrative: AIReadingResult = {
  emotionalMirror: 'You came here because tomorrow matters deeply to you.',
  symbolMeaning: 'Bridge appears when effort has reached the point where outcomes are no longer created by worrying.',
  possibleBlindSpot: 'The waiting may actually be harder than the interview itself.',
  reflectionQuestions: [
    'What do you need to feel settled, regardless of the outcome?',
    'If tomorrow goes differently than you hope, what remains true about you?',
    'What would you do the day after, in either case?',
  ],
  oneActionForToday: 'Write one sentence about what you have already done well in this process.',
  closingLine: 'One closed path is not the end of your story.',
  locale: 'en',
};

// ---------------------------------------------------------------------------
// isValidAIReadingResult
// ---------------------------------------------------------------------------

describe('isValidAIReadingResult', () => {
  it('accepts a fully valid narrative', () => {
    expect(isValidAIReadingResult(validNarrative)).toBe(true);
  });

  it('accepts zh locale', () => {
    expect(isValidAIReadingResult({ ...validNarrative, locale: 'zh' })).toBe(true);
  });

  it('rejects null', () => {
    expect(isValidAIReadingResult(null)).toBe(false);
  });

  it('rejects a string', () => {
    expect(isValidAIReadingResult('narrative text')).toBe(false);
  });

  it('rejects missing emotionalMirror', () => {
    expect(isValidAIReadingResult({ ...validNarrative, emotionalMirror: undefined })).toBe(false);
  });

  it('rejects empty string emotionalMirror', () => {
    expect(isValidAIReadingResult({ ...validNarrative, emotionalMirror: '' })).toBe(false);
  });

  it('rejects missing symbolMeaning', () => {
    expect(isValidAIReadingResult({ ...validNarrative, symbolMeaning: undefined })).toBe(false);
  });

  it('rejects missing possibleBlindSpot', () => {
    expect(isValidAIReadingResult({ ...validNarrative, possibleBlindSpot: undefined })).toBe(false);
  });

  it('rejects missing oneActionForToday', () => {
    expect(isValidAIReadingResult({ ...validNarrative, oneActionForToday: undefined })).toBe(false);
  });

  it('rejects missing closingLine', () => {
    expect(isValidAIReadingResult({ ...validNarrative, closingLine: undefined })).toBe(false);
  });

  it('rejects missing locale', () => {
    expect(isValidAIReadingResult({ ...validNarrative, locale: undefined })).toBe(false);
  });

  it('rejects reflectionQuestions that is not an array', () => {
    expect(isValidAIReadingResult({ ...validNarrative, reflectionQuestions: 'three questions' })).toBe(false);
  });

  it('rejects reflectionQuestions with fewer than 3 items', () => {
    expect(isValidAIReadingResult({ ...validNarrative, reflectionQuestions: ['q1', 'q2'] })).toBe(false);
  });

  it('rejects reflectionQuestions with more than 3 items', () => {
    expect(isValidAIReadingResult({
      ...validNarrative,
      reflectionQuestions: ['q1', 'q2', 'q3', 'q4'],
    })).toBe(false);
  });

  it('rejects reflectionQuestions containing an empty string', () => {
    expect(isValidAIReadingResult({
      ...validNarrative,
      reflectionQuestions: ['q1', '', 'q3'],
    })).toBe(false);
  });

  it('rejects reflectionQuestions containing a non-string', () => {
    expect(isValidAIReadingResult({
      ...validNarrative,
      reflectionQuestions: ['q1', 42, 'q3'],
    })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateAINarrative — fetch mocking
// ---------------------------------------------------------------------------

describe('generateAINarrative', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  const mockInput = {
    topic: 'career' as const,
    emotion: 'hopeful' as const,
    symbolId: 'bridge' as const,
    concern: 'I really hope I get a return offer tomorrow.',
    locale: 'en' as const,
    dateString: '2026-08-03',
  };

  const mockDeterministicResult = {
    emotionalMirror: 'Hope about work is not naivety.',
    symbolMeaning: 'A collaboration or transition is possible.',
    possibleBlindSpot: 'Is the direction you are heading still the direction you want to go?',
    reflectionQuestions: ['What is the gap?', 'Who is willing?', 'Are you the one building?'] as [string, string, string],
    oneActionForToday: 'Reach out to one person.',
    closingLine: 'Your work is not separate from who you are becoming.',
    symbolMeta: { id: 'bridge' as const, names: { en: 'Bridge', zh: '桥' } },
  };

  it('returns ok:true with a valid narrative on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, narrative: validNarrative }),
    }));

    const result = await generateAINarrative(mockInput, mockDeterministicResult);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.narrative.emotionalMirror).toBe(validNarrative.emotionalMirror);
    }
  });

  it('returns ok:false reason:no-api-key when server reports no key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, reason: 'no-api-key' }),
    }));

    const result = await generateAINarrative(mockInput, mockDeterministicResult);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('no-api-key');
  });

  it('returns ok:false reason:network-error on fetch exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await generateAINarrative(mockInput, mockDeterministicResult);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('network-error');
  });

  it('returns ok:false reason:error on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: 'AI service error' }),
    }));

    const result = await generateAINarrative(mockInput, mockDeterministicResult);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('error');
  });

  it('returns ok:false reason:invalid-response when narrative fails validation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, narrative: { emotionalMirror: 'only one field' } }),
    }));

    const result = await generateAINarrative(mockInput, mockDeterministicResult);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-response');
  });

  it('returns ok:false reason:aborted when fetch is cancelled via AbortSignal', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(
      Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }),
    ));

    const ctrl = new AbortController();
    ctrl.abort();
    const result = await generateAINarrative(mockInput, mockDeterministicResult, { signal: ctrl.signal });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('aborted');
  });

  it('returns ok:false reason:timeout when server responds with 504 and reason:timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false, reason: 'timeout' }),
    }));

    const result = await generateAINarrative(mockInput, mockDeterministicResult);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('timeout');
  });

  it('passes the AbortSignal through to fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, narrative: validNarrative }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const ctrl = new AbortController();
    await generateAINarrative(mockInput, mockDeterministicResult, { signal: ctrl.signal });

    const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
    expect(callArgs.signal).toBe(ctrl.signal);
  });
});
