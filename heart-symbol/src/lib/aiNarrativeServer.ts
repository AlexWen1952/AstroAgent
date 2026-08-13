/**
 * Server-only utilities for the AI narrative feature.
 *
 * This module contains no browser APIs and no Next.js imports — it can be
 * imported in unit tests without mocking the Next.js runtime.
 */
import type { ReadingInput, ReadingResult, AIReadingResult } from '@/types/reading';

// ---------------------------------------------------------------------------
// Language consistency
// ---------------------------------------------------------------------------

/** Unicode ranges that are predominantly CJK (Chinese, Japanese, Korean). */
const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}]/gu;

function countCJK(text: string): number {
  return (text.match(CJK_RE) ?? []).length;
}

/**
 * Heuristic check that the AI responded in (approximately) the requested locale.
 *
 * zh: expects at least 10 CJK characters across all fields combined.
 * en (and all other locales): expects fewer than 5 CJK characters total.
 *
 * This is intentionally lenient — it catches the worst-case "model ignored the
 * locale instruction" failures without over-rejecting valid mixed content.
 */
export function isLocaleConsistent(fields: string[], locale: string): boolean {
  const total = countCJK(fields.join(' '));
  if (locale === 'zh') return total >= 10;
  return total < 5;
}

// ---------------------------------------------------------------------------
// Post-generation prohibited content check
// ---------------------------------------------------------------------------

/**
 * Patterns whose presence in the AI output is a safety violation.
 * Checked after generation, before returning content to the client.
 *
 * Not exhaustive — designed to catch the most likely model failures given the
 * existing system-prompt instructions.  The system prompt remains the primary
 * safety control; this is a second-pass backstop.
 */
const PROHIBITED_PATTERNS: RegExp[] = [
  // Future-certainty predictions directed at the user
  /\byou will\b/i,
  /\bthis will\b/i,
  /\bit will\b/i,
  /\bwill happen\b/i,
  /\bwill work out\b/i,
  /\bwill succeed\b/i,
  /\bwill definitely\b/i,
  // Explicit guarantees
  /\bguarantee[ds]?\b/i,
  // Clinical diagnosis labels (intent: model naming a condition, not general wellness language)
  /\bclinical depression\b/i,
  /\banxiety disorder\b/i,
  /\bschizophreni/i,
  /\bbipolar disorder\b/i,
  /\b(OCD|PTSD|BPD)\b/,   // acronym-only; no /i so "ocd" won't match (too many false positives)
  // Claims about another person's inner state
  /\bI know (exactly )?what (they|he|she) (think|feel|want|know)\b/i,
  /\bthey definitely (think|feel|want|know|are)\b/i,
  // Fear-based escalation language
  /\bthings? (will )?get worse\b/i,
  /\bif you don'?t\b/i,
];

/**
 * Returns true if any field in the provided array contains a prohibited
 * content pattern. Callers should reject the narrative and fall back to the
 * deterministic reading when this returns true.
 */
export function containsProhibitedContent(fields: string[]): boolean {
  const combined = fields.join('\n');
  return PROHIBITED_PATTERNS.some((re) => re.test(combined));
}

// ---------------------------------------------------------------------------
// Response parsing and validation
// ---------------------------------------------------------------------------

/** Minimum character count (trimmed) for each AI output field. */
export const MIN_FIELD_LENGTH = 10;

/**
 * Parses the raw object returned by the AI and validates its structure,
 * minimum field lengths, language consistency, and prohibited content.
 *
 * Throws an Error with a descriptive message (NOT forwarded to the client —
 * callers must produce a safe generic error message themselves).
 */
export function parseAIResponse(raw: unknown, locale: string): AIReadingResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('AI response is not an object');
  }
  const obj = raw as Record<string, unknown>;

  const stringFields = [
    'emotionalMirror',
    'symbolMeaning',
    'possibleBlindSpot',
    'oneActionForToday',
    'closingLine',
  ] as const;

  for (const key of stringFields) {
    if (typeof obj[key] !== 'string') {
      throw new Error(`AI field missing or wrong type: ${key}`);
    }
    if ((obj[key] as string).trim().length < MIN_FIELD_LENGTH) {
      throw new Error(`AI field too short (< ${MIN_FIELD_LENGTH} chars): ${key}`);
    }
  }

  const qs = obj['reflectionQuestions'];
  if (!Array.isArray(qs) || qs.length !== 3) {
    throw new Error('reflectionQuestions must be an array of exactly 3 items');
  }
  for (let i = 0; i < 3; i++) {
    if (typeof qs[i] !== 'string' || (qs[i] as string).trim().length < MIN_FIELD_LENGTH) {
      throw new Error(`reflectionQuestions[${i}] missing or too short`);
    }
  }

  const narrative: AIReadingResult = {
    emotionalMirror: (obj['emotionalMirror'] as string).trim(),
    symbolMeaning: (obj['symbolMeaning'] as string).trim(),
    possibleBlindSpot: (obj['possibleBlindSpot'] as string).trim(),
    reflectionQuestions: [
      (qs[0] as string).trim(),
      (qs[1] as string).trim(),
      (qs[2] as string).trim(),
    ],
    oneActionForToday: (obj['oneActionForToday'] as string).trim(),
    closingLine: (obj['closingLine'] as string).trim(),
    locale,
  };

  const allFields: string[] = [
    narrative.emotionalMirror,
    narrative.symbolMeaning,
    narrative.possibleBlindSpot,
    ...narrative.reflectionQuestions,
    narrative.oneActionForToday,
    narrative.closingLine,
  ];

  if (!isLocaleConsistent(allFields, locale)) {
    throw new Error(`AI response language inconsistent with requested locale "${locale}"`);
  }

  if (containsProhibitedContent(allFields)) {
    throw new Error('AI response contains prohibited content');
  }

  return narrative;
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

export function buildSystemPrompt(locale: string): string {
  const languageInstruction =
    locale === 'zh'
      ? 'IMPORTANT: Write all output fields in Simplified Chinese (简体中文).'
      : 'Write all output fields in English.';

  return `You are an emotionally intelligent reflection guide for Heart Symbol, a personal reflection app. Your role is to rewrite a structured reading so it feels warm, personal, and connected to the user's specific situation — not generic.

${languageInstruction}

SAFETY RULES (absolute, non-negotiable):
- NEVER predict the future with certainty. No "will happen", "you will", "this will work out".
- NEVER diagnose or imply a mental health condition by name.
- NEVER claim to know another person's thoughts, feelings, or intentions.
- NEVER promise outcomes or guarantee results.
- NEVER use fear-based language ("if you don't...", "this is a warning", "things will get worse").
- NEVER encourage dependency on this product.
- Write in warm, conversational second person ("you"), not clinical or mystical.
- The symbol reflects; it does not predict or judge.
- If the user mentions a crisis situation, respond with care but still direct them to professional support.

TONE: Poetic where fitting, always grounded. Like a wise, non-judgmental friend — not a therapist, not a fortune teller.

OUTPUT FORMAT: Respond with a single JSON object containing exactly these fields:
{
  "emotionalMirror": "<1–3 sentences acknowledging the user's feeling and connecting to their concern>",
  "symbolMeaning": "<2–4 sentences connecting the symbol's meaning to the user's specific situation>",
  "possibleBlindSpot": "<1–3 sentences gently naming what the user may not be seeing — specific to their concern>",
  "reflectionQuestions": ["<question 1>", "<question 2>", "<question 3>"],
  "oneActionForToday": "<a single, concrete, doable action connected to the user's concern>",
  "closingLine": "<a poetic, non-predictive closing sentence>"
}

REFLECTION QUESTIONS: Make them feel like they arose naturally from the user's specific situation, not from a template. Do not start all three questions the same way.`;
}

export function buildUserPrompt(input: ReadingInput, result: ReadingResult): string {
  const symbolName = result.symbolMeta.names[input.locale] ?? result.symbolMeta.names.en;
  const topicLabel: Record<string, string> = {
    love: 'Love / 爱情',
    career: 'Career / 事业',
    money: 'Money / 财务',
    family: 'Family / 家庭',
    self: 'Self / 自我',
  };
  const emotionLabel: Record<string, string> = {
    anxious: 'Anxious / 焦虑',
    confused: 'Confused / 困惑',
    sad: 'Sad / 悲伤',
    hopeful: 'Hopeful / 充满希望',
    stuck: 'Stuck / 卡住了',
  };

  return `USER CONTEXT:
Concern (their words): "${input.concern}"
Topic area: ${topicLabel[input.topic] ?? input.topic}
Current feeling: ${emotionLabel[input.emotion] ?? input.emotion}
Symbol drawn: ${symbolName}

DETERMINISTIC READING TO REWRITE (use this as your reference — rewrite each section to feel personal):

Emotional Mirror: ${result.emotionalMirror}

Symbol Meaning: ${result.symbolMeaning}

Possible Blind Spot: ${result.possibleBlindSpot}

Reflection Questions:
1. ${result.reflectionQuestions[0]}
2. ${result.reflectionQuestions[1]}
3. ${result.reflectionQuestions[2]}

One Action for Today: ${result.oneActionForToday}

Closing Line: ${result.closingLine}

Rewrite each section so it naturally references or connects to the user's actual concern. The user wrote: "${input.concern}" — let that be present in the voice.`;
}
