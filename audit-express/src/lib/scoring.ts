export interface QuestionOption {
  value: number;
  label: string;
}

export interface Question {
  id: string;
  category: 'digital' | 'ops' | 'sales';
  text: string;
  weight: number;
  options: QuestionOption[];
}

export interface RecoCondition {
  category?: 'digital' | 'ops' | 'sales';
  minScore?: number;
  maxScore?: number;
  scoreTotal?: { min?: number; max?: number };
}

export interface RecoRule {
  id: string;
  condition: RecoCondition;
  priority: number;
  title: string;
  description: string;
  action: string;
}

export interface ScoreBreakdown {
  digital: number;
  ops: number;
  sales: number;
}

export interface Recommendation {
  id: string;
  priority: number;
  title: string;
  description: string;
  action: string;
}

export interface ScoringResult {
  scoreTotal: number;
  scoreBreakdown: ScoreBreakdown;
  recommendations: Recommendation[];
}

export function computeScore(
  questions: Question[],
  answers: Record<string, number>,
  recoRules: RecoRule[]
): ScoringResult {
  const breakdown: ScoreBreakdown = { digital: 0, ops: 0, sales: 0 };

  for (const q of questions) {
    const answer = answers[q.id];
    if (answer !== undefined) {
      const cat = q.category as keyof ScoreBreakdown;
      breakdown[cat] = (breakdown[cat] || 0) + answer;
    }
  }

  // Normalize to 40/30/30
  const maxByCategory: Record<string, number> = { digital: 40, ops: 30, sales: 30 };
  const rawMaxByCategory: Record<string, number> = { digital: 0, ops: 0, sales: 0 };

  for (const q of questions) {
    const maxOption = Math.max(...q.options.map((o) => o.value));
    rawMaxByCategory[q.category] = (rawMaxByCategory[q.category] || 0) + maxOption;
  }

  const normalizedBreakdown: ScoreBreakdown = { digital: 0, ops: 0, sales: 0 };
  for (const cat of ['digital', 'ops', 'sales'] as const) {
    const rawMax = rawMaxByCategory[cat] || 1;
    normalizedBreakdown[cat] = Math.round((breakdown[cat] / rawMax) * maxByCategory[cat]);
  }

  const scoreTotal = normalizedBreakdown.digital + normalizedBreakdown.ops + normalizedBreakdown.sales;

  // Apply reco rules
  const matchedRecos: Recommendation[] = [];
  for (const rule of recoRules) {
    const { condition } = rule;
    let match = false;

    if (condition.category) {
      const catScore = normalizedBreakdown[condition.category];
      const minOk = condition.minScore === undefined || catScore >= condition.minScore;
      const maxOk = condition.maxScore === undefined || catScore <= condition.maxScore;
      match = minOk && maxOk;
    } else if (condition.scoreTotal) {
      const minOk = condition.scoreTotal.min === undefined || scoreTotal >= condition.scoreTotal.min;
      const maxOk = condition.scoreTotal.max === undefined || scoreTotal <= condition.scoreTotal.max;
      match = minOk && maxOk;
    }

    if (match) {
      matchedRecos.push({
        id: rule.id,
        priority: rule.priority,
        title: rule.title,
        description: rule.description,
        action: rule.action,
      });
    }
  }

  // Sort by priority and take top 3
  const recommendations = matchedRecos
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  return { scoreTotal, scoreBreakdown: normalizedBreakdown, recommendations };
}
