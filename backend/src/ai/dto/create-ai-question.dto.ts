import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateAiQuestionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  question!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
