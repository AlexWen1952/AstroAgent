import type { Topic, Emotion } from '@/types/session';
import type { SymbolId } from '@/types/symbol';
import { SYMBOL_IDS } from '@/data/symbols';
import { simpleHash } from './hash';

/**
 * Deterministically selects a SymbolId from topic, emotion, and ISO date string.
 *
 * The same (topic, emotion, dateString) triple always produces the same SymbolId.
 * Different dates may produce different symbols.
 *
 * dateString must be ISO YYYY-MM-DD (e.g. "2026-08-02").
 * Time-of-day and timezone are intentionally excluded so that two sessions
 * on the same calendar day with the same topic+emotion receive the same symbol.
 *
 * No Math.random() is used.
 */
export function selectSymbol(
  topic: Topic,
  emotion: Emotion,
  dateString: string,
): SymbolId {
  const input = `${topic}-${emotion}-${dateString}`;
  const hash = simpleHash(input);
  const index = hash % SYMBOL_IDS.length;
  return SYMBOL_IDS[index];
}
