import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IntakeItemType } from '../../common/enums';

/** Mirrors `IntakeItemCreate` (openapi.json). */
export class CreateIntakeItemDto {
  @IsEnum(IntakeItemType)
  itemType!: IntakeItemType;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  ingredientName?: string | null;

  @IsOptional()
  @IsString()
  doseAmount?: string | null;

  @IsOptional()
  @IsString()
  instructions?: string | null;
}
