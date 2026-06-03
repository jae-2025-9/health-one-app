import { CosmeticSafetyLevel } from '../common/enums';

export interface AnalyzedIngredient {
  ingredientName: string;
  safetyLevel: CosmeticSafetyLevel;
  effectSummary: string | null;
  cautionSummary: string | null;
}

/**
 * Illustrative ingredient-caution rule set. Deterministic STUB for a real
 * ingredient knowledge base; the {@link analyzeIngredientText} contract is
 * stable so the data source can be swapped later.
 */
const CAUTION_INGREDIENTS: Array<{ match: string; caution: string }> = [
  { match: 'fragrance', caution: '향료는 민감성 피부에 자극을 줄 수 있습니다.' },
  { match: 'parfum', caution: '향료(parfum)는 민감성 피부에 자극을 줄 수 있습니다.' },
  { match: 'alcohol', caution: '알코올은 건성/민감성 피부를 건조하게 할 수 있습니다.' },
  { match: 'retinol', caution: '레티놀은 자외선 민감도를 높일 수 있어 자외선 차단이 필요합니다.' },
  { match: 'salicylic', caution: '살리실산은 임신 중이거나 민감성 피부라면 주의가 필요합니다.' },
];

/** Splits an INCI-style ingredient list (comma / newline separated). */
function tokenizeIngredients(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function analyzeIngredientText(text: string): AnalyzedIngredient[] {
  return tokenizeIngredients(text).map((name) => {
    const lower = name.toLowerCase();
    const hit = CAUTION_INGREDIENTS.find((c) => lower.includes(c.match));
    return {
      ingredientName: name,
      safetyLevel: hit ? CosmeticSafetyLevel.caution : CosmeticSafetyLevel.unknown,
      effectSummary: null,
      cautionSummary: hit ? hit.caution : null,
    };
  });
}
