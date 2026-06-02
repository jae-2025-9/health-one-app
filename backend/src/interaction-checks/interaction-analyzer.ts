import { InteractionRiskLevel } from '../common/enums';

export interface AnalyzableItem {
  itemType: 'medication' | 'supplement';
  name: string;
  ingredientName: string | null;
}

export interface InteractionEvidence {
  items: string[];
  riskLevel: InteractionRiskLevel;
  note: string;
}

export interface InteractionAnalysis {
  riskLevel: InteractionRiskLevel;
  summary: string;
  recommendation: string;
  evidence: InteractionEvidence[];
}

/**
 * Illustrative known-pair rule set keyed by normalized ingredient/name tokens.
 * This is a deterministic STUB standing in for a real interaction database;
 * the public {@link analyzeInteractions} contract stays stable when the data
 * source is swapped for a clinical knowledge base.
 */
const KNOWN_PAIRS: Array<{
  a: string;
  b: string;
  riskLevel: InteractionRiskLevel;
  note: string;
}> = [
  { a: 'warfarin', b: 'vitamin k', riskLevel: InteractionRiskLevel.high, note: '비타민 K는 와파린의 항응고 효과를 약화시킬 수 있습니다.' },
  { a: 'warfarin', b: 'aspirin', riskLevel: InteractionRiskLevel.high, note: '함께 복용 시 출혈 위험이 증가할 수 있습니다.' },
  { a: 'iron', b: 'calcium', riskLevel: InteractionRiskLevel.medium, note: '칼슘은 철분 흡수를 방해할 수 있어 복용 간격을 두는 것이 좋습니다.' },
  { a: 'caffeine', b: 'iron', riskLevel: InteractionRiskLevel.medium, note: '카페인은 철분 흡수를 줄일 수 있습니다.' },
  { a: 'magnesium', b: 'zinc', riskLevel: InteractionRiskLevel.low, note: '고용량 동시 복용 시 흡수 경쟁이 있을 수 있으나 일반적으로 경미합니다.' },
];

const RISK_ORDER: Record<InteractionRiskLevel, number> = {
  [InteractionRiskLevel.unknown]: 0,
  [InteractionRiskLevel.low]: 1,
  [InteractionRiskLevel.medium]: 2,
  [InteractionRiskLevel.high]: 3,
};

function tokens(item: AnalyzableItem): string[] {
  return [item.ingredientName, item.name]
    .filter((v): v is string => !!v)
    .map((v) => v.trim().toLowerCase());
}

function matches(item: AnalyzableItem, needle: string): boolean {
  return tokens(item).some((t) => t.includes(needle));
}

export function analyzeInteractions(
  items: AnalyzableItem[],
): InteractionAnalysis {
  const evidence: InteractionEvidence[] = [];

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      for (const rule of KNOWN_PAIRS) {
        const direct = matches(items[i], rule.a) && matches(items[j], rule.b);
        const reverse = matches(items[i], rule.b) && matches(items[j], rule.a);
        if (direct || reverse) {
          evidence.push({
            items: [items[i].name, items[j].name],
            riskLevel: rule.riskLevel,
            note: rule.note,
          });
        }
      }
    }
  }

  if (evidence.length === 0) {
    // No data found → never claim "safe"; report unknown (안전선).
    return {
      riskLevel: InteractionRiskLevel.unknown,
      summary: '입력한 조합에 대한 알려진 상호작용 정보를 찾지 못했습니다.',
      recommendation:
        '정보가 없다고 해서 안전을 의미하지 않습니다. 질환이나 처방약이 있다면 전문가와 상담하세요.',
      evidence: [],
    };
  }

  const riskLevel = evidence.reduce<InteractionRiskLevel>(
    (max, e) => (RISK_ORDER[e.riskLevel] > RISK_ORDER[max] ? e.riskLevel : max),
    InteractionRiskLevel.low,
  );

  return {
    riskLevel,
    summary: `일부 성분 조합에서 주의가 필요할 수 있습니다 (${evidence.length}건).`,
    recommendation:
      riskLevel === InteractionRiskLevel.high
        ? '복용을 시작하기 전에 반드시 전문가와 상담하세요.'
        : '복용 간격을 두고, 증상이 있으면 전문가와 상담하세요.',
    evidence,
  };
}
