import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ReminderTargetType } from '../../common/enums';

export class CreateReminderDto {
  @IsEnum(ReminderTargetType)
  targetType!: ReminderTargetType;

  @IsOptional()
  @IsUUID()
  targetId?: string | null;

  @IsString()
  @MaxLength(100)
  title!: string;

  @IsString()
  rrule!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
