import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DateRangeQueryDto } from '../common/dto/date-range-query.dto';
import { DataSourceType, HealthEventType } from '../common/enums';
import { createHealthEvent } from '../common/health-events/health-event.factory';
import { mapHealthEvent } from '../common/health-events/health-event.mapper';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBeverageDto } from './dto/create-beverage.dto';
import { CreateMealDto } from './dto/create-meal.dto';
import { ImageAnalysisRequestDto } from './dto/image-analysis-request.dto';
import {
  analyzeBeverageLabel,
  analyzeMealImage,
  NUTRITION_SAFETY_NOTICE,
} from './nutrition-analyzer';

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  async analyzeMealImage(userId: string, dto: ImageAnalysisRequestDto) {
    const mealDraft = analyzeMealImage(dto);
    const result = await this.persistAnalysis(userId, dto.imageUrl, 'meal_image', {
      mealDraft,
    });

    return {
      analysisId: result.id,
      mealDraft,
      safetyNotice: NUTRITION_SAFETY_NOTICE,
    };
  }

  async analyzeBeverageLabel(userId: string, dto: ImageAnalysisRequestDto) {
    const beverageDraft = analyzeBeverageLabel(dto);
    const result = await this.persistAnalysis(
      userId,
      dto.imageUrl,
      'beverage_label',
      { beverageDraft },
    );

    return {
      analysisId: result.id,
      beverageDraft,
      safetyNotice: NUTRITION_SAFETY_NOTICE,
    };
  }

  async createMeal(userId: string, dto: CreateMealDto) {
    const event = await this.prisma.$transaction(async (tx) => {
      const healthEvent = await createHealthEvent(
        tx,
        userId,
        HealthEventType.meal,
        dto,
      );
      await tx.mealLog.create({
        data: {
          healthEventId: healthEvent.id,
          mealType: dto.mealType,
          totalKcal: dto.totalKcal ?? null,
          carbsG: dto.carbsG ?? null,
          proteinG: dto.proteinG ?? null,
          fatG: dto.fatG ?? null,
          analysisStatus:
            dto.sourceType === DataSourceType.vision_ai ? 'analyzed' : 'manual',
          foodItems: {
            create: dto.items.map((item) => ({
              name: item.name,
              servingAmount: item.servingAmount ?? null,
              servingUnit: item.servingUnit ?? null,
              kcal: item.kcal ?? null,
              carbsG: item.carbsG ?? null,
              proteinG: item.proteinG ?? null,
              fatG: item.fatG ?? null,
              confidenceScore: item.confidenceScore ?? null,
            })),
          },
        },
      });
      return healthEvent;
    });

    return mapHealthEvent(event);
  }

  async listMeals(userId: string, query: DateRangeQueryDto) {
    const rows = await this.prisma.mealLog.findMany({
      where: { healthEvent: { userId, startedAt: dateWhere(query) } },
      include: { healthEvent: { include: { source: true } }, foodItems: true },
      orderBy: { healthEvent: { startedAt: 'desc' } },
    });

    return rows.map((row) => ({
      healthEvent: mapHealthEvent(row.healthEvent),
      mealType: row.mealType,
      totalKcal: numberOrNull(row.totalKcal),
      carbsG: numberOrNull(row.carbsG),
      proteinG: numberOrNull(row.proteinG),
      fatG: numberOrNull(row.fatG),
      analysisStatus: row.analysisStatus,
      items: row.foodItems.map((item) => ({
        id: item.id,
        name: item.name,
        servingAmount: numberOrNull(item.servingAmount),
        servingUnit: item.servingUnit,
        kcal: numberOrNull(item.kcal),
        carbsG: numberOrNull(item.carbsG),
        proteinG: numberOrNull(item.proteinG),
        fatG: numberOrNull(item.fatG),
        confidenceScore: numberOrNull(item.confidenceScore),
      })),
    }));
  }

  async createBeverage(userId: string, dto: CreateBeverageDto) {
    const event = await this.prisma.$transaction(async (tx) => {
      const healthEvent = await createHealthEvent(
        tx,
        userId,
        HealthEventType.beverage,
        dto,
      );
      await tx.beverageLog.create({
        data: {
          healthEventId: healthEvent.id,
          beverageType: dto.beverageType,
          name: dto.name ?? null,
          volumeMl: dto.volumeMl ?? null,
          kcal: dto.kcal ?? null,
          sugarG: dto.sugarG ?? null,
          caffeineMg: dto.caffeineMg ?? null,
          analysisStatus:
            dto.sourceType === DataSourceType.label_scan ? 'analyzed' : 'manual',
        },
      });
      return healthEvent;
    });

    return mapHealthEvent(event);
  }

  async getBeverageSummary(userId: string, query: DateRangeQueryDto) {
    const rows = await this.prisma.beverageLog.findMany({
      where: { healthEvent: { userId, startedAt: dateWhere(query) } },
    });

    return {
      from: query.from ?? null,
      to: query.to ?? null,
      recordCount: rows.length,
      totalVolumeMl: sum(rows, (row) => row.volumeMl),
      totalKcal: sum(rows, (row) => row.kcal),
      totalSugarG: sum(rows, (row) => row.sugarG),
      totalCaffeineMg: sum(rows, (row) => row.caffeineMg),
    };
  }

  private async persistAnalysis(
    userId: string,
    imageUrl: string,
    analysisType: string,
    resultPayload: Record<string, unknown>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const media = await tx.mediaAsset.create({
        data: {
          userId,
          mediaType: 'image',
          purpose: analysisType,
          storageUrl: imageUrl,
        },
      });

      return tx.aiAnalysisResult.create({
        data: {
          mediaAssetId: media.id,
          analysisType,
          modelName: 'deterministic_stub_v1',
          confidenceScore: 0.75,
          resultPayload: resultPayload as Prisma.InputJsonValue,
          safetyNotice: NUTRITION_SAFETY_NOTICE,
        },
      });
    });
  }
}

function dateWhere(query: DateRangeQueryDto) {
  const where: Prisma.DateTimeFilter = {};
  if (query.from) where.gte = new Date(query.from);
  if (query.to) where.lte = new Date(query.to);
  return Object.keys(where).length ? where : undefined;
}

function numberOrNull(value: unknown): number | null {
  return value == null ? null : Number(value);
}

function sum<T>(rows: T[], pick: (row: T) => unknown): number {
  return rows.reduce((total, row) => total + Number(pick(row) ?? 0), 0);
}
