import { describe, it, expect } from 'vitest';
import { computeScore, Question, RecoRule } from '../src/lib/scoring';

const mockQuestions: Question[] = [
  { id: 'q1', category: 'digital', text: 'Q1', weight: 8, options: [{ value: 0, label: 'No' }, { value: 8, label: 'Yes' }] },
  { id: 'q2', category: 'digital', text: 'Q2', weight: 8, options: [{ value: 0, label: 'No' }, { value: 8, label: 'Yes' }] },
  { id: 'q3', category: 'ops', text: 'Q3', weight: 8, options: [{ value: 0, label: 'No' }, { value: 8, label: 'Yes' }] },
  { id: 'q4', category: 'ops', text: 'Q4', weight: 7, options: [{ value: 0, label: 'No' }, { value: 7, label: 'Yes' }] },
  { id: 'q5', category: 'sales', text: 'Q5', weight: 10, options: [{ value: 0, label: 'No' }, { value: 10, label: 'Yes' }] },
];

const mockRecoRules: RecoRule[] = [
  {
    id: 'reco1',
    condition: { category: 'digital', maxScore: 20 },
    priority: 1,
    title: 'Improve Digital',
    description: 'You need digital improvements.',
    action: 'Start digitalizing',
  },
  {
    id: 'reco2',
    condition: { scoreTotal: { min: 71 } },
    priority: 3,
    title: 'Advanced Optimization',
    description: 'Great score!',
    action: 'Keep optimizing',
  },
];

describe('computeScore', () => {
  it('returns zero scores when all answers are 0', () => {
    const answers = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 };
    const result = computeScore(mockQuestions, answers, mockRecoRules);
    expect(result.scoreTotal).toBe(0);
    expect(result.scoreBreakdown.digital).toBe(0);
    expect(result.scoreBreakdown.ops).toBe(0);
    expect(result.scoreBreakdown.sales).toBe(0);
  });

  it('returns max scores when all answers are max', () => {
    const answers = { q1: 8, q2: 8, q3: 8, q4: 7, q5: 10 };
    const result = computeScore(mockQuestions, answers, mockRecoRules);
    expect(result.scoreBreakdown.digital).toBe(40);
    expect(result.scoreBreakdown.ops).toBe(30);
    expect(result.scoreBreakdown.sales).toBe(30);
    expect(result.scoreTotal).toBe(100);
  });

  it('applies reco rules correctly for low digital score', () => {
    const answers = { q1: 0, q2: 0, q3: 8, q4: 7, q5: 10 };
    const result = computeScore(mockQuestions, answers, mockRecoRules);
    expect(result.recommendations.some((r) => r.id === 'reco1')).toBe(true);
  });

  it('applies reco rules for high total score', () => {
    const answers = { q1: 8, q2: 8, q3: 8, q4: 7, q5: 10 };
    const result = computeScore(mockQuestions, answers, mockRecoRules);
    expect(result.recommendations.some((r) => r.id === 'reco2')).toBe(true);
  });

  it('returns at most 3 recommendations', () => {
    const manyRules: RecoRule[] = Array.from({ length: 10 }, (_, i) => ({
      id: `r${i}`,
      condition: { scoreTotal: { max: 100 } },
      priority: i + 1,
      title: `Reco ${i}`,
      description: `Description ${i}`,
      action: `Action ${i}`,
    }));
    const answers = { q1: 4, q2: 4, q3: 4, q4: 3, q5: 5 };
    const result = computeScore(mockQuestions, answers, manyRules);
    expect(result.recommendations.length).toBeLessThanOrEqual(3);
  });

  it('handles missing answers gracefully', () => {
    const answers = { q1: 8 };
    const result = computeScore(mockQuestions, answers, mockRecoRules);
    expect(result.scoreTotal).toBeGreaterThanOrEqual(0);
    expect(result.scoreTotal).toBeLessThanOrEqual(100);
  });
});
