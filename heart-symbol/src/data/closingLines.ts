import type { Topic } from '@/types/session';
import type { LocalizedString } from '@/types/locale';

/**
 * 5 Closing Lines — one per topic.
 * Poetic, non-predictive closing statements. Not promises, not predictions.
 */
export const CLOSING_LINES: Record<Topic, LocalizedString> = {
  love: {
    en: 'Something in you already knows what you are reaching toward.',
    zh: '你内心深处，已经知道自己在朝什么靠近。',
  },
  career: {
    en: 'Your work is not separate from who you are becoming.',
    zh: '你的工作，与你正在成为的那个人，从来都不是分开的。',
  },
  money: {
    en: 'What you tend to consistently, tends to grow.',
    zh: '你持续用心对待的，终会生长。',
  },
  family: {
    en: 'You are shaped by your family — and you also shape it.',
    zh: '你被家庭塑造，同时你也在塑造着它。',
  },
  self: {
    en: 'You are not yet who you will be. That is not a problem. That is the work.',
    zh: '你还不是未来的那个自己。这不是问题，这正是修行。',
  },
};
