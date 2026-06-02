import { IsOptional, IsString, IsUUID } from 'class-validator';
import { HealthEventCreateDto } from '../../common/dto/health-event-create.dto';

/** Mirrors `CosmeticUsageCreate` = HealthEventCreate + usage fields (openapi.json). */
export class CreateCosmeticUsageDto extends HealthEventCreateDto {
  @IsUUID()
  cosmeticProductId!: string;

  @IsOptional()
  @IsString()
  bodyArea?: string | null;

  @IsOptional()
  @IsString()
  reactionNote?: string | null;
}
