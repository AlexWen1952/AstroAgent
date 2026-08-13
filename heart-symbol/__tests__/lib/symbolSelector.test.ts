import { describe, it, expect } from 'vitest';
import { selectSymbol } from '@/lib/symbolSelector';
import { SYMBOL_IDS } from '@/data/symbols';
import type { Topic, Emotion } from '@/types/session';

const TOPICS: Topic[] = ['love', 'career', 'money', 'family', 'self'];
const EMOTIONS: Emotion[] = ['anxious', 'confused', 'sad', 'hopeful', 'stuck'];
const DATE_A = '2026-08-02';
const DATE_B = '2026-08-03';

describe('selectSymbol', () => {
  it('always returns a valid SymbolId', () => {
    for (const topic of TOPICS) {
      for (const emotion of EMOTIONS) {
        const id = selectSymbol(topic, emotion, DATE_A);
        expect(SYMBOL_IDS).toContain(id);
      }
    }
  });

  it('is deterministic — same inputs always return the same symbol', () => {
    for (const topic of TOPICS) {
      for (const emotion of EMOTIONS) {
        expect(selectSymbol(topic, emotion, DATE_A)).toBe(
          selectSymbol(topic, emotion, DATE_A),
        );
      }
    }
  });

  it('same date, same topic, same emotion → same symbol (within-day stability)', () => {
    expect(selectSymbol('love', 'anxious', DATE_A)).toBe(
      selectSymbol('love', 'anxious', DATE_A),
    );
  });

  it('different dates can produce different symbols', () => {
    // Not guaranteed for every pair, but should differ somewhere across all combos
    const resultsA = TOPICS.flatMap((t) => EMOTIONS.map((e) => selectSymbol(t, e, DATE_A)));
    const resultsB = TOPICS.flatMap((t) => EMOTIONS.map((e) => selectSymbol(t, e, DATE_B)));
    const hasDifference = resultsA.some((id, i) => id !== resultsB[i]);
    expect(hasDifference).toBe(true);
  });

  it('different topics with same emotion+date can produce different symbols', () => {
    const ids = TOPICS.map((t) => selectSymbol(t, 'anxious', DATE_A));
    // At least some should differ
    const unique = new Set(ids);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('different emotions with same topic+date can produce different symbols', () => {
    const ids = EMOTIONS.map((e) => selectSymbol('love', e, DATE_A));
    const unique = new Set(ids);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('covers all 12 symbols across a range of inputs', () => {
    const seen = new Set<string>();
    const dates = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01',
                   '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01'];
    for (const date of dates) {
      for (const topic of TOPICS) {
        for (const emotion of EMOTIONS) {
          seen.add(selectSymbol(topic, emotion, date));
        }
      }
    }
    // All 12 symbols should appear across the grid of inputs
    expect(seen.size).toBe(12);
  });
});
