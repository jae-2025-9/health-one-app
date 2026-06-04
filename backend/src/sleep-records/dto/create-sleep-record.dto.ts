import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { HealthEventCreateDto } from '../../common/dto/health-event-create.dto';

export class CreateSleepRecordDto extends HealthEventCreateDto {
  @IsNumber()
  @Min(0)
  totalMinutes!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  awakeMinutes?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deepSleepMinutes?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remSleepMinutes?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sleepScore?: number | null;

  @IsOptional()
  @IsString()
  qualityNote?: string | null;
}
