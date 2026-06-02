import { analyzeIngredientText } from './ingredient-analyzer';

describe('analyzeIngredientText', () => {
  it('splits a comma-separated INCI list', () => {
    const result = analyzeIngredientText('Water, Glycerin, Niacinamide');
    expect(result.map((r) => r.ingredientName)).toEqual([
      'Water',
      'Glycerin',
      'Niacinamide',
    ]);
  });

  it('marks known irritants as caution with a note', () => {
    const result = analyzeIngredientText('Water, Fragrance, Alcohol');
    const fragrance = result.find((r) => r.ingredientName === 'Fragrance');
    expect(fragrance?.safetyLevel).toBe('caution');
    expect(fragrance?.cautionSummary).toBeTruthy();
  });

  it('defaults unknown ingredients to "unknown" with no caution', () => {
    const result = analyzeIngredientText('Aqua');
    expect(result[0].safetyLevel).toBe('unknown');
    expect(result[0].cautionSummary).toBeNull();
  });

  it('ignores empty entries from trailing separators', () => {
    const result = analyzeIngredientText('Water,\n,Glycerin,');
    expect(result).toHaveLength(2);
  });
});
