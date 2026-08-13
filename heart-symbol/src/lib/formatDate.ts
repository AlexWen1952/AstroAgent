import type { Locale } from '@/types/locale';

/** Map app locale codes to BCP 47 tags understood by Intl.DateTimeFormat. */
const LOCALE_MAP: Record<Locale, string> = {
  en: 'en-US',
  zh: 'zh-CN',
};

/**
 * Format an ISO 8601 timestamp into a human-readable date string for the given locale.
 *
 * Examples:
 *   formatDate('2026-08-02T14:00:00Z', 'en') → "August 2, 2026"
 *   formatDate('2026-08-02T14:00:00Z', 'zh') → "2026年8月2日"
 *
 * Falls back to the raw ISO string if parsing fails.
 */
export function formatDate(isoString: string, locale: Locale): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleDateString(LOCALE_MAP[locale], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}
