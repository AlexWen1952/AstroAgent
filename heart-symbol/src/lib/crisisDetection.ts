/**
 * Crisis keyword detection — client-side only, pure function.
 *
 * When a trigger phrase is found, the UI shows a compassionate banner with
 * a crisis helpline number. The user is NEVER blocked from continuing.
 * No data is sent anywhere. No keywords are exposed in the public API.
 *
 * Source of truth for phrases: SAFETY.md
 */

// English triggers — checked case-insensitively.
const EN_TRIGGERS: readonly string[] = [
  // Suicidality
  'kill myself',
  'end my life',
  "don't want to be here anymore",
  'dont want to be here anymore',
  'suicide',
  'suicidal',
  // Self-harm
  'hurt myself',
  'cutting',
  'self-harm',
  'self harm',
  // Harm to others
  'hurt someone',
  'hurt him',
  'hurt her',
  // Immediate crisis
  'emergency',
  'in danger',
  'being abused',
  'abuse me',
];

// Chinese triggers — checked as substring (Chinese has no case).
const ZH_TRIGGERS: readonly string[] = [
  // Suicidality
  '想死',
  '不想活',
  '自杀',
  '结束生命',
  '活不下去',
  // Self-harm
  '伤害自己',
  '割腕',
  '自残',
  // Harm to others
  '伤害他',
  '伤害她',
  '打人',
  // Immediate crisis
  '有危险',
  '被虐待',
  '紧急',
];

/**
 * Returns true if the concern text contains any high-risk phrase.
 *
 * This is intentionally simple — false positives and negatives are expected.
 * The goal is to surface a helpline resource, not to perfectly classify distress.
 */
export function detectCrisis(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (EN_TRIGGERS.some((phrase) => lower.includes(phrase))) return true;
  if (ZH_TRIGGERS.some((phrase) => text.includes(phrase))) return true;
  return false;
}
