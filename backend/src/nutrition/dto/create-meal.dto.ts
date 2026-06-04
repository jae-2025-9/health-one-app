import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { HealthEventCreateDto } from '../../common/dto/health-event-create.dto';
import { FoodItemDto } from './food-item.dto';

export class CreateMealDto extends HealthEventCreateDto {
  @IsString()
  mealType!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalKcal?: number | null;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItemDto)
  items!: FoodItemDto[];
}
