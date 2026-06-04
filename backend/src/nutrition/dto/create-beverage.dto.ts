import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { HealthEventCreateDto } from '../../common/dto/health-event-create.dto';

export class CreateBeverageDto extends HealthEventCreateDto {
  @IsString()
  beverageType!: string;

  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  volumeMl?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  kcal?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sugarG?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  caffeineMg?: number | null;
}
