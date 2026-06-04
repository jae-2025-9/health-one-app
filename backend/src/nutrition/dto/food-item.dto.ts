import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class FoodItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  servingAmount?: number | null;

  @IsOptional()
  @IsString()
  servingUnit?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  kcal?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carbsG?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinG?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fatG?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore?: number | null;
}
