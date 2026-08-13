import { describe, it, expect } from 'vitest';
import {
  isLocaleConsistent,
  containsProhibitedContent,
  parseAIResponse,
  MIN_FIELD_LENGTH,
} from '@/lib/aiNarrativeServer';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EN_FIELDS = [
  'You came here because tomorrow matters deeply to you.',
  'Bridge appears when effort has reached a point of stillness.',
  'The waiting may be harder than the meeting itself.',
  'What do you need to feel settled regardless of the outcome?',
  'If tomorrow goes differently, what remains true about you?',
  'What would you do the day after, in either case?',
  'Write one sentence about something you have already done well.',
  'One closed path is not the end of your story.',
];

const ZH_FIELDS = [
  '你来到这里，因为明天对你意义重大。',
  '桥出现在努力已经到达平静之处时。',
  '等待可能比会面本身更难熬。',
  '不论结果如何，你需要什么才能平静？',
  '如果明天走向不同，有什么依然是真实的？',
  '无论哪种情况，隔天你会怎么做？',
  '写下一句关于你已经做得好的事情。',
  '一条关闭的路不是你故事的终点。',
];

const RAW_VALID_EN = {
  emotionalMirror: 'You came here because tomorrow matters deeply to you and that is real.',
  symbolMeaning: 'Bridge appears when effort has reached the point of stillness, not stagnation.',
  possibleBlindSpot: 'The waiting may actually be harder than the meeting itself.',
  reflectionQuestions: [
    'What do you need to feel settled regardless of the outcome?',
    'If tomorrow goes differently, what remains true about you?',
    'What would you do the day after, in either case?',
  ],
  oneActionForToday: 'Write one sentence about something you have already done well in this process.',
  closingLine: 'One closed path is not the end of your story.',
};

const RAW_VALID_ZH = {
  emotionalMirror: '你来到这里，因为明天对你意义重大，这是真实的。',
  symbolMeaning: '桥出现在努力已经到达平静而非停滞之处时。',
  possibleBlindSpot: '等待可能比会面本身更难熬。',
  reflectionQuestions: [
    '不论结果如何，你需要什么才能平静？',
    '如果明天走向不同，有什么依然是真实的？',
    '无论哪种情况，隔天你会怎么做？',
  ],
  oneActionForToday: '写下一句关于你在这个过程中已经做得好的事情。',
  closingLine: '一条关闭的路不是你故事的终点。',
};

// ---------------------------------------------------------------------------
// isLocaleConsistent
// ---------------------------------------------------------------------------

describe('isLocaleConsistent', () => {
  it('accepts English fields for en locale', () => {
    expect(isLocaleConsistent(EN_FIELDS, 'en')).toBe(true);
  });

  it('accepts Chinese fields for zh locale', () => {
    expect(isLocaleConsistent(ZH_FIELDS, 'zh')).toBe(true);
  });

  it('rejects English-only fields for zh locale', () => {
    expect(isLocaleConsistent(EN_FIELDS, 'zh')).toBe(false);
  });

  it('rejects Chinese-only fields for en locale', () => {
    expect(isLocaleConsistent(ZH_FIELDS, 'en')).toBe(false);
  });

  it('accepts a mix of English and a few CJK chars for en locale', () => {
    // e.g. a Chinese name embedded in English text — still passes
    const mixed = ['Hello 桥 world.', ...EN_FIELDS.slice(1)];
    expect(isLocaleConsistent(mixed, 'en')).toBe(true);
  });

  it('treats unknown locales the same as en (< 5 CJK required)', () => {
    expect(isLocaleConsistent(EN_FIELDS, 'fr')).toBe(true);
    expect(isLocaleConsistent(ZH_FIELDS, 'fr')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// containsProhibitedContent
// ---------------------------------------------------------------------------

describe('containsProhibitedContent', () => {
  it('returns false for benign content', () => {
    expect(containsProhibitedContent(EN_FIELDS)).toBe(false);
  });

  it('flags "you will" (future certainty)', () => {
    expect(containsProhibitedContent(['You will get the offer.'])).toBe(true);
  });

  it('flags "this will" (future certainty)', () => {
    expect(containsProhibitedContent(['This will work out for you.'])).toBe(true);
  });

  it('flags "will happen" (future certainty)', () => {
    expect(containsProhibitedContent(['Good things will happen.'])).toBe(true);
  });

  it('flags "guaranteed" (explicit guarantee)', () => {
    expect(containsProhibitedContent(['Success is guaranteed.'])).toBe(true);
  });

  it('flags "clinical depression" (diagnosis)', () => {
    expect(containsProhibitedContent(['This sounds like clinical depression.'])).toBe(true);
  });

  it('flags "anxiety disorder" (diagnosis)', () => {
    expect(containsProhibitedContent(['You may have an anxiety disorder.'])).toBe(true);
  });

  it('flags "schizophrenia" (diagnosis)', () => {
    expect(containsProhibitedContent(['Signs of schizophrenia are present.'])).toBe(true);
  });

  it('flags "OCD" (diagnosis acronym)', () => {
    expect(containsProhibitedContent(['This looks like OCD behavior.'])).toBe(true);
  });

  it('flags "PTSD" (diagnosis acronym)', () => {
    expect(containsProhibitedContent(['You are showing PTSD symptoms.'])).toBe(true);
  });

  it('flags "I know what they think" (claims about another\'s mind)', () => {
    expect(containsProhibitedContent(['I know what they think about this.'])).toBe(true);
  });

  it('flags "they definitely feel" (claims about another\'s mind)', () => {
    expect(containsProhibitedContent(['They definitely feel resentment.'])).toBe(true);
  });

  it('flags "things will get worse" (fear-based)', () => {
    expect(containsProhibitedContent(['Things will get worse if you wait.'])).toBe(true);
  });

  it('flags "if you don\'t" (fear-based)', () => {
    expect(containsProhibitedContent(["If you don't act, you'll regret it."])).toBe(true);
  });

  it('does not flag "will" used in reflection questions (benign future)', () => {
    // "What would you do the day after" — no match
    expect(containsProhibitedContent(['What would you do the day after?'])).toBe(false);
  });

  it('does not flag "they" used in benign context', () => {
    expect(containsProhibitedContent(['They may see things differently than you.'])).toBe(false);
  });

  it('checks across all fields — flags match in second field', () => {
    expect(containsProhibitedContent(['Safe text.', 'You will be fine.'])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseAIResponse
// ---------------------------------------------------------------------------

describe('parseAIResponse', () => {
  it('parses a valid English response', () => {
    const result = parseAIResponse(RAW_VALID_EN, 'en');
    expect(result.emotionalMirror).toBe(RAW_VALID_EN.emotionalMirror);
    expect(result.locale).toBe('en');
    expect(result.reflectionQuestions).toHaveLength(3);
  });

  it('parses a valid Chinese response', () => {
    const result = parseAIResponse(RAW_VALID_ZH, 'zh');
    expect(result.locale).toBe('zh');
  });

  it('trims whitespace from all fields', () => {
    const padded = {
      ...RAW_VALID_EN,
      emotionalMirror: '  ' + RAW_VALID_EN.emotionalMirror + '  ',
    };
    const result = parseAIResponse(padded, 'en');
    expect(result.emotionalMirror).toBe(RAW_VALID_EN.emotionalMirror);
  });

  it('throws on non-object input', () => {
    expect(() => parseAIResponse('string', 'en')).toThrow();
    expect(() => parseAIResponse(null, 'en')).toThrow();
    expect(() => parseAIResponse(42, 'en')).toThrow();
  });

  it(`throws when a string field is shorter than ${MIN_FIELD_LENGTH} chars`, () => {
    expect(() =>
      parseAIResponse({ ...RAW_VALID_EN, closingLine: 'Short.' }, 'en'),
    ).toThrow(/too short/);
  });

  it('throws when emotionalMirror is missing', () => {
    expect(() =>
      parseAIResponse({ ...RAW_VALID_EN, emotionalMirror: undefined }, 'en'),
    ).toThrow();
  });

  it('throws when reflectionQuestions has only 2 items', () => {
    expect(() =>
      parseAIResponse({ ...RAW_VALID_EN, reflectionQuestions: ['q1 long enough', 'q2 long enough'] }, 'en'),
    ).toThrow(/exactly 3/);
  });

  it('throws when a reflectionQuestion is too short', () => {
    expect(() =>
      parseAIResponse(
        { ...RAW_VALID_EN, reflectionQuestions: ['short', RAW_VALID_EN.reflectionQuestions[1], RAW_VALID_EN.reflectionQuestions[2]] },
        'en',
      ),
    ).toThrow(/too short/);
  });

  it('throws when locale is zh but content is English (language inconsistency)', () => {
    expect(() => parseAIResponse(RAW_VALID_EN, 'zh')).toThrow(/inconsistent/);
  });

  it('throws when locale is en but content is Chinese (language inconsistency)', () => {
    expect(() => parseAIResponse(RAW_VALID_ZH, 'en')).toThrow(/inconsistent/);
  });

  it('throws when response contains "you will" (future certainty)', () => {
    expect(() =>
      parseAIResponse(
        { ...RAW_VALID_EN, emotionalMirror: 'You will receive the offer, we are certain of that.' },
        'en',
      ),
    ).toThrow(/prohibited/);
  });

  it('throws when response contains "guaranteed" (guarantee)', () => {
    expect(() =>
      parseAIResponse(
        { ...RAW_VALID_EN, closingLine: 'Your success is guaranteed to come.' },
        'en',
      ),
    ).toThrow(/prohibited/);
  });

  it('throws when response contains a clinical diagnosis label', () => {
    expect(() =>
      parseAIResponse(
        { ...RAW_VALID_EN, possibleBlindSpot: 'This pattern can indicate clinical depression at work.' },
        'en',
      ),
    ).toThrow(/prohibited/);
  });

  it('throws when response claims to know another person\'s mind', () => {
    expect(() =>
      parseAIResponse(
        { ...RAW_VALID_EN, symbolMeaning: 'I know what they think about your performance.' },
        'en',
      ),
    ).toThrow(/prohibited/);
  });

  it('throws when response uses fear-based language', () => {
    expect(() =>
      parseAIResponse(
        { ...RAW_VALID_EN, possibleBlindSpot: "If you don't decide soon, you will regret it." },
        'en',
      ),
    ).toThrow(/prohibited/);
  });
});
