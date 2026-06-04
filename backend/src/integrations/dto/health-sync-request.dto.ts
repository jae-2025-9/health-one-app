import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DataSourceType, HealthEventType } from '../../common/enums';

export class HealthSyncEventDto {
  @IsEnum(HealthEventType)
  eventType!: HealthEventType;

  @IsOptional()
  @IsEnum(DataSourceType)
  sourceType?: DataSourceType;

  @IsOptional()
  @IsString()
  externalRecordId?: string;

  @IsISO8601()
  startedAt!: string;

  @IsOptional()
  @IsISO8601()
  endedAt?: string;

  @IsString()
  timezone!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore?: number;

  @IsOptional()
  @IsObject()
  rawPayload?: Record<string, unknown>;
}

export class HealthSyncRequestDto {
  @IsEnum(DataSourceType)
  sourceType!: DataSourceType;

  @IsOptional()
  @IsString()
  externalAccountId?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => HealthSyncEventDto)
  events!: HealthSyncEventDto[];
}
