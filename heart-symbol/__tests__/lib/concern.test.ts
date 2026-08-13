import { describe, it, expect } from 'vitest';
import {
  validateConcern,
  trimConcern,
  CONCERN_MAX_LENGTH,
  CONCERN_MIN_LENGTH,
} from '@/lib/concern';

describe('trimConcern', () => {
  it('trims leading whitespace', () => {
    expect(trimConcern('   hello')).toBe('hello');
  });
  it('trims trailing whitespace', () => {
    expect(trimConcern('hello   ')).toBe('hello');
  });
  it('trims both ends', () => {
    expect(trimConcern('  hello  ')).toBe('hello');
  });
  it('leaves inner whitespace intact', () => {
    expect(trimConcern('  hello world  ')).toBe('hello world');
  });
  it('returns empty string for whitespace-only input', () => {
    expect(trimConcern('   ')).toBe('');
  });
});

describe('validateConcern', () => {
  describe('valid inputs', () => {
    it('accepts exactly MIN_LENGTH characters', () => {
      const text = 'a'.repeat(CONCERN_MIN_LENGTH);
      const result = validateConcern(text);
      expect(result.isValid).toBe(true);
      expect(result.trimmedLength).toBe(CONCERN_MIN_LENGTH);
    });

    it('accepts exactly MAX_LENGTH characters', () => {
      const text = 'a'.repeat(CONCERN_MAX_LENGTH);
      const result = validateConcern(text);
      expect(result.isValid).toBe(true);
      expect(result.remaining).toBe(0);
      expect(result.atMax).toBe(true);
    });

    it('accepts a typical English concern', () => {
      const text = 'I am struggling to decide whether to leave my job.';
      const result = validateConcern(text);
      expect(result.isValid).toBe(true);
    });

    it('accepts a typical Chinese concern', () => {
      const text = '我对我的感情关系感到非常困惑，不知道该如何是好。';
      const result = validateConcern(text);
      expect(result.isValid).toBe(true);
    });

    it('accepts text that is MIN_LENGTH when trimmed', () => {
      const text = '  ' + 'a'.repeat(CONCERN_MIN_LENGTH) + '  ';
      const result = validateConcern(text);
      expect(result.isValid).toBe(true);
      expect(result.trimmedLength).toBe(CONCERN_MIN_LENGTH);
    });
  });

  describe('invalid inputs — too short', () => {
    it('rejects empty string', () => {
      const result = validateConcern('');
      expect(result.isValid).toBe(false);
      expect(result.trimmedLength).toBe(0);
    });

    it('rejects whitespace-only input', () => {
      const result = validateConcern('          ');
      expect(result.isValid).toBe(false);
      expect(result.trimmedLength).toBe(0);
    });

    it('rejects one character less than MIN_LENGTH', () => {
      const text = 'a'.repeat(CONCERN_MIN_LENGTH - 1);
      const result = validateConcern(text);
      expect(result.isValid).toBe(false);
    });

    it('rejects text that is only whitespace after trimming', () => {
      const text = ' '.repeat(50);
      const result = validateConcern(text);
      expect(result.isValid).toBe(false);
      expect(result.trimmedLength).toBe(0);
    });
  });

  describe('invalid inputs — too long', () => {
    it('rejects text one character over MAX_LENGTH', () => {
      const text = 'a'.repeat(CONCERN_MAX_LENGTH + 1);
      const result = validateConcern(text);
      expect(result.isValid).toBe(false);
      expect(result.rawLength).toBe(CONCERN_MAX_LENGTH + 1);
    });

    it('reports atMax when rawLength equals MAX_LENGTH', () => {
      const text = 'a'.repeat(CONCERN_MAX_LENGTH);
      const result = validateConcern(text);
      expect(result.atMax).toBe(true);
    });
  });

  describe('remaining count', () => {
    it('reports correct remaining characters', () => {
      const text = 'a'.repeat(100);
      const result = validateConcern(text);
      expect(result.remaining).toBe(CONCERN_MAX_LENGTH - 100);
    });

    it('reports 0 remaining (not negative) when over max', () => {
      const text = 'a'.repeat(CONCERN_MAX_LENGTH + 50);
      const result = validateConcern(text);
      expect(result.remaining).toBe(0);
    });
  });

  describe('rawLength vs trimmedLength', () => {
    it('rawLength reflects un-trimmed input', () => {
      const text = '  hello  ';
      const result = validateConcern(text);
      expect(result.rawLength).toBe(text.length);
      expect(result.trimmedLength).toBe('hello'.length);
    });
  });
});
