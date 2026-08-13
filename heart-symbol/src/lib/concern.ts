export const CONCERN_MAX_LENGTH = 300;
export const CONCERN_MIN_LENGTH = 10;

/** Trim leading/trailing whitespace from concern text. */
export function trimConcern(text: string): string {
  return text.trim();
}

export interface ConcernValidation {
  /** True when the trimmed length is ≥ MIN and the raw length is ≤ MAX. */
  isValid: boolean;
  /** Length of the trimmed text. */
  trimmedLength: number;
  /** Length of the raw (un-trimmed) text. */
  rawLength: number;
  /** Characters remaining before the max is reached (may be negative). */
  remaining: number;
  /** True when rawLength equals or exceeds the max. */
  atMax: boolean;
}

export function validateConcern(text: string): ConcernValidation {
  const trimmed = trimConcern(text);
  const rawLength = text.length;
  const trimmedLength = trimmed.length;
  const remaining = CONCERN_MAX_LENGTH - rawLength;
  return {
    isValid: trimmedLength >= CONCERN_MIN_LENGTH && rawLength <= CONCERN_MAX_LENGTH,
    trimmedLength,
    rawLength,
    remaining: Math.max(0, remaining),
    atMax: rawLength >= CONCERN_MAX_LENGTH,
  };
}
