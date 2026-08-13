import type { LocalizedString } from './locale';
import type { Topic } from './session';

export type SymbolId =
  | 'river'
  | 'mirror'
  | 'door'
  | 'lantern'
  | 'mist'
  | 'seed'
  | 'bridge'
  | 'thread'
  | 'moon'
  | 'stone'
  | 'tide'
  | 'garden';

export type SymbolFamily = 'water' | 'earth' | 'path';

export interface HeartSymbol {
  id: SymbolId;
  family: SymbolFamily;
  /** Language-independent thematic keywords used by the reading engine. */
  themes: string[];
  names: LocalizedString;
  shortMeaning: LocalizedString;
  lightMeaning: LocalizedString;
  shadowMeaning: LocalizedString;
  topicInterpretations: Record<Topic, LocalizedString>;
  /** Exactly three reflection questions. */
  reflectionQuestions: [LocalizedString, LocalizedString, LocalizedString];
  /** Exactly three realistic actions. */
  realisticActions: [LocalizedString, LocalizedString, LocalizedString];
}
