import type { Locale, LocalizedString } from './locale';
import type { Topic, Emotion } from './session';
import type { SymbolId } from './symbol';

export interface ReadingInput {
  topic: Topic;
  emotion: Emotion;
  symbolId: SymbolId;
  /** User's free-text concern — max 300 characters. */
  concern: string;
  locale: Locale;
  /** ISO YYYY-MM-DD of the session. */
  dateString: string;
  /** True when the concern triggered crisis keyword detection. */
  crisisDetected?: boolean;
}

export interface ReadingResult {
  emotionalMirror: string;
  symbolMeaning: string;
  possibleBlindSpot: string;
  reflectionQuestions: [string, string, string];
  oneActionForToday: string;
  closingLine: string;
  /** Symbol metadata the UI needs without importing the full symbol table. */
  symbolMeta: {
    id: SymbolId;
    names: LocalizedString;
  };
}

/**
 * AI-personalized rewrite of a ReadingResult.
 * Contains the same six content sections as ReadingResult but rewritten by the
 * AI layer to feel connected to the user's specific concern.
 *
 * symbolMeta is omitted — it is always sourced from the deterministic engine.
 * The locale this was generated in is stored alongside for display decisions.
 */
export type AIReadingResult = Omit<ReadingResult, 'symbolMeta'> & {
  /** The locale the AI responded in. */
  locale: string;
};

export interface SavedReading {
  /** Schema version — increment if the shape changes incompatibly. */
  version: 1;
  id: string;
  /** ISO 8601 timestamp of when the reading was saved. */
  savedAt: string;
  input: ReadingInput;
  /** Deterministic reading — always present; source of truth. */
  result: ReadingResult;
  /**
   * Optional AI-personalized narrative.
   * Present only when the user requested personalization before saving.
   * Generated in aiNarrative.locale — may differ from the current UI locale.
   */
  aiNarrative?: AIReadingResult | null;
}
