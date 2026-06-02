import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { IntakeItemType } from '../../common/enums';

export class InteractionCheckItemInput {
  @IsEnum(IntakeItemType)
  itemType!: IntakeItemType;

  @IsUUID()
  itemId!: string;
}

/** Mirrors `InteractionCheckCreate` (openapi.json) — at least 2 items. */
export class CreateInteractionCheckDto {
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => InteractionCheckItemInput)
  items!: InteractionCheckItemInput[];
}
