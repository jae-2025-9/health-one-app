import { IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * Mirrors `CosmeticAnalysisRequest` (openapi.json). The contract requires
 * anyOf [ingredientText, imageUrl]; that cross-field rule is enforced in the
 * service (BadRequest if neither is present).
 */
export class AnalyzeIngredientsDto {
  @IsOptional()
  @IsString()
  productName?: string | null;

  @IsOptional()
  @IsString()
  brand?: string | null;

  @IsOptional()
  @IsString()
  ingredientText?: string | null;

  @IsOptional()
  @IsUrl()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  skinType?: string | null;
}
