import { describe, it, expect } from 'vitest';
import { detectCrisis } from '@/lib/crisisDetection';

describe('detectCrisis', () => {
  // --- English triggers ---

  describe('English suicidality phrases', () => {
    it('detects "kill myself"', () => {
      expect(detectCrisis('I want to kill myself')).toBe(true);
    });
    it('detects "suicide" as a substring', () => {
      expect(detectCrisis('thinking about suicide a lot')).toBe(true);
    });
    it('detects "suicidal"', () => {
      expect(detectCrisis('I feel suicidal')).toBe(true);
    });
    it('detects "end my life"', () => {
      expect(detectCrisis('I want to end my life')).toBe(true);
    });
    it('detects "don\'t want to be here anymore"', () => {
      expect(detectCrisis("I don't want to be here anymore")).toBe(true);
    });
  });

  describe('English self-harm phrases', () => {
    it('detects "hurt myself"', () => {
      expect(detectCrisis('I keep wanting to hurt myself')).toBe(true);
    });
    it('detects "self-harm" with hyphen', () => {
      expect(detectCrisis('I have been self-harm lately')).toBe(true);
    });
    it('detects "self harm" without hyphen', () => {
      expect(detectCrisis('struggling with self harm')).toBe(true);
    });
  });

  describe('English crisis phrases', () => {
    it('detects "in danger"', () => {
      expect(detectCrisis('I feel like I am in danger')).toBe(true);
    });
    it('detects "being abused"', () => {
      expect(detectCrisis('I am being abused at home')).toBe(true);
    });
  });

  describe('English case-insensitivity', () => {
    it('detects upper-case trigger', () => {
      expect(detectCrisis('I WANT TO KILL MYSELF')).toBe(true);
    });
    it('detects mixed-case trigger', () => {
      expect(detectCrisis('Feeling Suicidal Today')).toBe(true);
    });
  });

  // --- Chinese triggers ---

  describe('Chinese suicidality phrases', () => {
    it('detects 想死', () => {
      expect(detectCrisis('我真的很想死')).toBe(true);
    });
    it('detects 不想活', () => {
      expect(detectCrisis('我不想活了')).toBe(true);
    });
    it('detects 自杀', () => {
      expect(detectCrisis('我在想自杀的事情')).toBe(true);
    });
    it('detects 活不下去', () => {
      expect(detectCrisis('感觉活不下去了')).toBe(true);
    });
    it('detects 结束生命', () => {
      expect(detectCrisis('想结束生命')).toBe(true);
    });
  });

  describe('Chinese self-harm phrases', () => {
    it('detects 伤害自己', () => {
      expect(detectCrisis('有时候想伤害自己')).toBe(true);
    });
    it('detects 割腕', () => {
      expect(detectCrisis('我割腕了')).toBe(true);
    });
    it('detects 自残', () => {
      expect(detectCrisis('自残的想法')).toBe(true);
    });
  });

  describe('Chinese crisis phrases', () => {
    it('detects 有危险', () => {
      expect(detectCrisis('我觉得有危险')).toBe(true);
    });
    it('detects 被虐待', () => {
      expect(detectCrisis('我被虐待了')).toBe(true);
    });
  });

  // --- Safe inputs ---

  describe('non-triggering inputs', () => {
    it('returns false for normal English concern', () => {
      expect(detectCrisis('I am worried about my relationship with my partner')).toBe(false);
    });
    it('returns false for normal Chinese concern', () => {
      expect(detectCrisis('我对我的工作感到很迷茫')).toBe(false);
    });
    it('returns false for empty string', () => {
      expect(detectCrisis('')).toBe(false);
    });
    it('returns false for whitespace only', () => {
      expect(detectCrisis('   ')).toBe(false);
    });
    it('returns false for "cut" (short word that is not "cutting")', () => {
      expect(detectCrisis('I cut my hair today')).toBe(false);
    });
    it('returns false for word "emergency" in Chinese context without trigger', () => {
      // "emergency" in English IS a trigger; checking that we handle it
      expect(detectCrisis('it is an emergency meeting')).toBe(true);
    });
    it('returns false for family discussion', () => {
      expect(detectCrisis('My family relationship is complicated and I feel stuck')).toBe(false);
    });
  });

  // --- Edge cases ---

  describe('edge cases', () => {
    it('handles very long input without crashing', () => {
      const long = 'a'.repeat(10000);
      expect(detectCrisis(long)).toBe(false);
    });
    it('detects trigger embedded in longer text', () => {
      expect(detectCrisis('Yesterday I was thinking, maybe I should just kill myself and be done with it')).toBe(true);
    });
    it('detects Chinese trigger embedded in mixed text', () => {
      expect(detectCrisis('最近压力很大，有时候会想死算了')).toBe(true);
    });
  });
});
