import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { DataSourceType, HealthEventType } from '../enums';

/**
 * Mirrors the `HealthEventCreate` contract schema (openapi.json). Intake-log and
 * cosmetic-usage create bodies extend this (the contract uses `allOf`).
 */
export class HealthEventCreateDto {
  @IsEnum(HealthEventType)
  eventType!: HealthEventType;

  @IsEnum(DataSourceType)
  sourceType!: DataSourceType;

  @IsOptional()
  @IsUUID()
  sourceId?: string | null;

  @IsOptional()
  @IsString()
  externalRecordId?: string | null;

  @IsISO8601()
  startedAt!: string;

  @IsOptional()
  @IsISO8601()
  endedAt?: string | null;

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
