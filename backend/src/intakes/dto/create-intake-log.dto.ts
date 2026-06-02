import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';
import { HealthEventCreateDto } from '../../common/dto/health-event-create.dto';
import { IntakeStatus } from '../../common/enums';

/** Mirrors `IntakeLogCreate` = HealthEventCreate + intake fields (openapi.json). */
export class CreateIntakeLogDto extends HealthEventCreateDto {
  @IsOptional()
  @IsUUID()
  medicationItemId?: string | null;

  @IsOptional()
  @IsUUID()
  supplementItemId?: string | null;

  @IsISO8601()
  takenAt!: string;

  @IsEnum(IntakeStatus)
  status!: IntakeStatus;

  @IsOptional()
  @IsString()
  note?: string | null;
}
