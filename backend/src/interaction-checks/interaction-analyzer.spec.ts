import { InteractionRiskLevel } from '../common/enums';
import { analyzeInteractions, AnalyzableItem } from './interaction-analyzer';

const item = (name: string, ingredientName: string | null = null): AnalyzableItem => ({
  itemType: 'supplement',
  name,
  ingredientName,
});

describe('analyzeInteractions', () => {
  it('returns unknown (never "safe") when no known interaction matches', () => {
    const result = analyzeInteractions([item('비타민 C'), item('프로바이오틱스')]);
    expect(result.riskLevel).toBe(InteractionRiskLevel.unknown);
    expect(result.evidence).toHaveLength(0);
    expect(result.recommendation).toContain('전문가');
  });

  it('flags a high-risk known pair (warfarin + vitamin k)', () => {
    const result = analyzeInteractions([
      item('와파린', 'Warfarin'),
      item('종합비타민', 'Vitamin K'),
    ]);
    expect(result.riskLevel).toBe(InteractionRiskLevel.high);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.recommendation).toContain('전문가');
  });

  it('escalates to the highest risk among multiple matches', () => {
    const result = analyzeInteractions([
      item('철분제', 'Iron'),
      item('칼슘제', 'Calcium'),
      item('아스피린', 'Aspirin'),
      item('와파린', 'Warfarin'),
    ]);
    expect(result.riskLevel).toBe(InteractionRiskLevel.high);
  });

  it('is order-independent (reverse pair still matches)', () => {
    const forward = analyzeInteractions([item('a', 'Iron'), item('b', 'Calcium')]);
    const reverse = analyzeInteractions([item('a', 'Calcium'), item('b', 'Iron')]);
    expect(reverse.riskLevel).toBe(forward.riskLevel);
    expect(reverse.evidence).toHaveLength(forward.evidence.length);
  });
});
