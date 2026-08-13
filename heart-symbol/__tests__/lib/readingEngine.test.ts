import { describe, it, expect } from 'vitest';
import { generateReading } from '@/lib/readingEngine';
import { SYMBOL_IDS, SYMBOLS, getSymbolById } from '@/data/symbols';
import type { ReadingInput } from '@/types/reading';
import type { Topic, Emotion } from '@/types/session';
import type { SymbolId } from '@/types/symbol';
import type { Locale } from '@/types/locale';

const TOPICS: Topic[] = ['love', 'career', 'money', 'family', 'self'];
const EMOTIONS: Emotion[] = ['anxious', 'confused', 'sad', 'hopeful', 'stuck'];
const LOCALES: Locale[] = ['en', 'zh'];
const DATE = '2026-08-02';
const CONCERN = 'I have been feeling uncertain about what comes next.';

function makeInput(
  topic: Topic,
  emotion: Emotion,
  symbolId: SymbolId,
  locale: Locale,
  crisisDetected = false,
): ReadingInput {
  return { topic, emotion, symbolId, concern: CONCERN, locale, dateString: DATE, crisisDetected };
}

describe('SYMBOL schema validation', () => {
  it('all 12 symbol records satisfy the required schema', () => {
    expect(SYMBOLS).toHaveLength(12);
    for (const symbol of SYMBOLS) {
      expect(SYMBOL_IDS).toContain(symbol.id);
      expect(['water', 'earth', 'path']).toContain(symbol.family);
      expect(symbol.themes.length).toBeGreaterThan(0);
      expect(symbol.names.en).toBeTruthy();
      expect(symbol.names.zh).toBeTruthy();
      expect(symbol.shortMeaning.en).toBeTruthy();
      expect(symbol.shortMeaning.zh).toBeTruthy();
      expect(symbol.lightMeaning.en).toBeTruthy();
      expect(symbol.lightMeaning.zh).toBeTruthy();
      expect(symbol.shadowMeaning.en).toBeTruthy();
      expect(symbol.shadowMeaning.zh).toBeTruthy();
      expect(symbol.reflectionQuestions).toHaveLength(3);
      expect(symbol.realisticActions).toHaveLength(3);
      for (const q of symbol.reflectionQuestions) {
        expect(q.en).toBeTruthy();
        expect(q.zh).toBeTruthy();
      }
      for (const a of symbol.realisticActions) {
        expect(a.en).toBeTruthy();
        expect(a.zh).toBeTruthy();
      }
      const topics: Topic[] = ['love', 'career', 'money', 'family', 'self'];
      for (const t of topics) {
        expect(symbol.topicInterpretations[t].en).toBeTruthy();
        expect(symbol.topicInterpretations[t].zh).toBeTruthy();
      }
    }
  });
});

describe('generateReading output completeness', () => {
  it('produces non-empty output for every topic × emotion × symbol combination in EN', () => {
    for (const topic of TOPICS) {
      for (const emotion of EMOTIONS) {
        for (const symbolId of SYMBOL_IDS) {
          const result = generateReading(makeInput(topic, emotion, symbolId, 'en'));
          expect(result.emotionalMirror).toBeTruthy();
          expect(result.symbolMeaning).toBeTruthy();
          expect(result.possibleBlindSpot).toBeTruthy();
          expect(result.oneActionForToday).toBeTruthy();
          expect(result.closingLine).toBeTruthy();
          expect(result.symbolMeta.id).toBe(symbolId);
          expect(result.symbolMeta.names.en).toBeTruthy();
          expect(result.symbolMeta.names.zh).toBeTruthy();
        }
      }
    }
  });

  it('produces non-empty output for every topic × emotion × symbol combination in ZH', () => {
    for (const topic of TOPICS) {
      for (const emotion of EMOTIONS) {
        for (const symbolId of SYMBOL_IDS) {
          const result = generateReading(makeInput(topic, emotion, symbolId, 'zh'));
          expect(result.emotionalMirror).toBeTruthy();
          expect(result.symbolMeaning).toBeTruthy();
          expect(result.possibleBlindSpot).toBeTruthy();
          expect(result.oneActionForToday).toBeTruthy();
          expect(result.closingLine).toBeTruthy();
        }
      }
    }
  });

  it('reflection questions always contain exactly three items', () => {
    for (const topic of TOPICS) {
      for (const emotion of EMOTIONS) {
        for (const symbolId of SYMBOL_IDS) {
          for (const locale of LOCALES) {
            const result = generateReading(makeInput(topic, emotion, symbolId, locale));
            expect(result.reflectionQuestions).toHaveLength(3);
            for (const q of result.reflectionQuestions) {
              expect(q).toBeTruthy();
            }
          }
        }
      }
    }
  });
});

describe('generateReading determinism', () => {
  it('same inputs always produce the same result', () => {
    const input = makeInput('love', 'anxious', 'river', 'en');
    const r1 = generateReading(input);
    const r2 = generateReading(input);
    expect(r1.emotionalMirror).toBe(r2.emotionalMirror);
    expect(r1.symbolMeaning).toBe(r2.symbolMeaning);
    expect(r1.possibleBlindSpot).toBe(r2.possibleBlindSpot);
    expect(r1.oneActionForToday).toBe(r2.oneActionForToday);
    expect(r1.closingLine).toBe(r2.closingLine);
    expect(r1.reflectionQuestions[0]).toBe(r2.reflectionQuestions[0]);
  });

  it('does not mutate the input object', () => {
    const input = makeInput('career', 'confused', 'moon', 'zh');
    const before = JSON.stringify(input);
    generateReading(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe('generateReading action selection', () => {
  it('one action for today is always one of the symbol\'s three realistic actions', () => {
    for (const topic of TOPICS) {
      for (const emotion of EMOTIONS) {
        for (const locale of LOCALES) {
          const symbolId: SymbolId = 'river';
          const symbol = getSymbolById(symbolId);
          const result = generateReading(makeInput(topic, emotion, symbolId, locale));
          const validActions = symbol.realisticActions.map((a) => a[locale]);
          expect(validActions).toContain(result.oneActionForToday);
        }
      }
    }
  });
});

describe('generateReading locale switching', () => {
  it('English and Chinese results differ (both non-empty, different text)', () => {
    const enResult = generateReading(makeInput('self', 'hopeful', 'garden', 'en'));
    const zhResult = generateReading(makeInput('self', 'hopeful', 'garden', 'zh'));
    expect(enResult.emotionalMirror).not.toBe(zhResult.emotionalMirror);
    expect(enResult.symbolMeaning).not.toBe(zhResult.symbolMeaning);
    expect(enResult.closingLine).not.toBe(zhResult.closingLine);
  });
});

describe('generateReading crisis mode', () => {
  it('produces a complete reading even when crisisDetected is true', () => {
    const input = makeInput('love', 'sad', 'mirror', 'en', true);
    const result = generateReading(input);
    expect(result.emotionalMirror).toBeTruthy();
    expect(result.symbolMeaning).toBeTruthy();
    expect(result.possibleBlindSpot).toBeTruthy();
    expect(result.reflectionQuestions).toHaveLength(3);
    expect(result.oneActionForToday).toBeTruthy();
    expect(result.closingLine).toBeTruthy();
  });

  it('crisis mode and non-crisis mode return identical reading content (engine does not alter content)', () => {
    const base = makeInput('family', 'stuck', 'bridge', 'en', false);
    const crisis = makeInput('family', 'stuck', 'bridge', 'en', true);
    const r1 = generateReading(base);
    const r2 = generateReading(crisis);
    // Content must be the same — safety is handled in the UI, not the engine
    expect(r1.emotionalMirror).toBe(r2.emotionalMirror);
    expect(r1.symbolMeaning).toBe(r2.symbolMeaning);
    expect(r1.closingLine).toBe(r2.closingLine);
  });
});

describe('generateReading — 300 topic × emotion × symbol spot check', () => {
  it('all 300 combinations (5 topics × 5 emotions × 12 symbols) produce valid output in both locales', () => {
    let count = 0;
    for (const topic of TOPICS) {
      for (const emotion of EMOTIONS) {
        for (const symbolId of SYMBOL_IDS) {
          for (const locale of LOCALES) {
            const result = generateReading(makeInput(topic, emotion, symbolId, locale));
            expect(result.emotionalMirror.length).toBeGreaterThan(10);
            expect(result.symbolMeaning.length).toBeGreaterThan(10);
            expect(result.possibleBlindSpot.length).toBeGreaterThan(10);
            expect(result.reflectionQuestions).toHaveLength(3);
            expect(result.oneActionForToday.length).toBeGreaterThan(10);
            expect(result.closingLine.length).toBeGreaterThan(5);
            count++;
          }
        }
      }
    }
    // 5 × 5 × 12 × 2 = 600 combinations verified
    expect(count).toBe(600);
  });
});
