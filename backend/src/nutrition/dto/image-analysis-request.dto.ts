import { IsISO8601, IsOptional, IsString, IsUrl } from 'class-validator';

export class ImageAnalysisRequestDto {
  @IsUrl({ require_tld: false })
  imageUrl!: string;

  @IsOptional()
  @IsISO8601()
  takenAt?: string | null;

  @IsOptional()
  @IsString()
  timezone?: string;
}
