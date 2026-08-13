import type { ReadingInput, ReadingResult } from '@/types/reading';
import { getSymbolById } from '@/data/symbols';
import { EMOTIONAL_MIRRORS } from '@/data/emotionalMirrors';
import { BLIND_SPOTS } from '@/data/blindSpots';
import { CLOSING_LINES } from '@/data/closingLines';
import { simpleHash } from './hash';

/**
 * Pure, deterministic reading engine.
 *
 * Takes a ReadingInput and returns a fully-localized ReadingResult.
 * No side effects. No browser APIs. No React dependencies. No API calls.
 * Input objects are never mutated.
 *
 * All combinations of (topic × emotion × symbolId × locale) produce
 * valid, non-empty output.
 */
export function generateReading(input: ReadingInput): ReadingResult {
  const { topic, emotion, symbolId, locale, crisisDetected } = input;

  const symbol = getSymbolById(symbolId);

  // Step 1 — Emotional Mirror: (emotion × topic) lookup
  const emotionalMirror = EMOTIONAL_MIRRORS[emotion][topic][locale];

  // Step 2 — Symbol Meaning: (symbol × topic) localized
  const symbolMeaning = symbol.topicInterpretations[topic][locale];

  // Step 3 — Possible Blind Spot: (emotion × symbolFamily) lookup
  const possibleBlindSpot = BLIND_SPOTS[emotion][symbol.family][locale];

  // Step 4 — Reflection Questions: all three, localized
  const reflectionQuestions: [string, string, string] = [
    symbol.reflectionQuestions[0][locale],
    symbol.reflectionQuestions[1][locale],
    symbol.reflectionQuestions[2][locale],
  ];

  // Step 5 — One Action for Today: deterministic selection from 3 actions
  // Uses (topic + emotion) so the action is stable for the same session inputs.
  const actionIndex = simpleHash(topic + emotion) % 3;
  const oneActionForToday = symbol.realisticActions[actionIndex][locale];

  // Step 6 — Closing Line: (topic) lookup
  const closingLine = CLOSING_LINES[topic][locale];

  // Symbol metadata for the UI (avoids importing the full symbol table in components)
  const symbolMeta = {
    id: symbol.id,
    names: symbol.names,
  };

  // When crisisDetected, the reading content itself remains unchanged —
  // SAFETY.md requires we do not frame the symbol as an answer to the crisis.
  // The UI layer is responsible for keeping safety resources prominent.
  void crisisDetected;

  return {
    emotionalMirror,
    symbolMeaning,
    possibleBlindSpot,
    reflectionQuestions,
    oneActionForToday,
    closingLine,
    symbolMeta,
  };
}
