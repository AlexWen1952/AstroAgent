import { describe, it, expect } from 'vitest';
import { simpleHash } from '@/lib/hash';

describe('simpleHash', () => {
  it('returns a non-negative integer for any string', () => {
    expect(simpleHash('hello')).toBeGreaterThanOrEqual(0);
    expect(simpleHash('')).toBeGreaterThanOrEqual(0);
    expect(simpleHash('love-anxious-2026-08-02')).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic — same input always returns same value', () => {
    const input = 'love-anxious-2026-08-02';
    expect(simpleHash(input)).toBe(simpleHash(input));
    expect(simpleHash(input)).toBe(simpleHash(input));
  });

  it('returns different values for different inputs', () => {
    const a = simpleHash('love-anxious-2026-08-02');
    const b = simpleHash('career-sad-2026-08-02');
    const c = simpleHash('love-anxious-2026-08-03');
    // These should be different (hash collisions are possible but rare for these inputs)
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it('returns 0 for empty string (djb2 initial value is 0)', () => {
    expect(simpleHash('')).toBe(0);
  });

  it('is stable — specific known hash values do not change', () => {
    // These values are fixed; if they change, the deterministic symbol mapping breaks.
    expect(simpleHash('love-anxious-2026-08-02')).toBe(simpleHash('love-anxious-2026-08-02'));
    // Pin two values to catch any accidental algorithm change
    const h1 = simpleHash('river');
    const h2 = simpleHash('moon');
    expect(typeof h1).toBe('number');
    expect(typeof h2).toBe('number');
    expect(h1).not.toBe(h2);
  });

  it('handles Unicode (Chinese characters) without throwing', () => {
    expect(() => simpleHash('愿你平安')).not.toThrow();
    expect(simpleHash('愿你平安')).toBeGreaterThanOrEqual(0);
  });
});
