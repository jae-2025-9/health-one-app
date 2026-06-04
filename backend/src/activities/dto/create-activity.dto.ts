import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { HealthEventCreateDto } from '../../common/dto/health-event-create.dto';

export class CreateActivityDto extends HealthEventCreateDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  steps?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  activeMinutes?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  activeKcal?: number | null;

  @IsOptional()
  @IsString()
  workoutType?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceMeters?: number | null;
}
