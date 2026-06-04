import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class PatchReminderDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  rrule?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
