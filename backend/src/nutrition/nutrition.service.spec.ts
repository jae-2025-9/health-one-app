import { DataSourceType, HealthEventType } from '../common/enums';
import { CreateBeverageDto } from './dto/create-beverage.dto';
import { CreateMealDto } from './dto/create-meal.dto';
import { NutritionService } from './nutrition.service';

const USER = 'user-1';

function healthEvent(eventType: HealthEventType, sourceType: DataSourceType) {
  return {
    id: `he-${eventType}-1`,
    eventType,
    sourceId: 'src-1',
    externalRecordId: null,
    startedAt: new Date('2026-05-25T08:00:00Z'),
    endedAt: null,
    timezone: 'Asia/Seoul',
    confidenceScore: 1,
    rawPayload: {},
    createdAt: new Date('2026-05-25T08:00:00Z'),
    source: { sourceType },
  };
}

describe('NutritionService', () => {
  it('analyzes meal images through media_assets and ai_analysis_results', async () => {
    const tx = {
      mediaAsset: {
        create: jest.fn(async () => ({ id: 'media-1' })),
      },
      aiAnalysisResult: {
        create: jest.fn(async ({ data }: any) => ({
          id: 'analysis-1',
          ...data,
        })),
      },
    };
    const prisma = { $transaction: jest.fn(async (cb: any) => cb(tx)) };
    const service = new NutritionService(prisma as any);

    const result = await service.analyzeMealImage(USER, {
      imageUrl: 'https://example.test/meal.jpg',
      takenAt: '2026-05-25T08:00:00+09:00',
    });

    expect(result.analysisId).toBe('analysis-1');
    expect(result.mealDraft.eventType).toBe(HealthEventType.meal);
    expect(result.mealDraft.sourceType).toBe(DataSourceType.vision_ai);
    expect(result.safetyNotice).toContain('의료 진단이 아닙니다');
    expect(tx.mediaAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER,
        mediaType: 'image',
        purpose: 'meal_image',
        storageUrl: 'https://example.test/meal.jpg',
      }),
    });
    expect(tx.aiAnalysisResult.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mediaAssetId: 'media-1',
        analysisType: 'meal_image',
        safetyNotice: expect.stringContaining('전문가'),
      }),
    });
  });

  it('creates meal logs and nested food_items from a confirmed draft', async () => {
    const tx = {
      dataSource: {
        findFirst: jest.fn(async () => ({ id: 'src-1' })),
        create: jest.fn(),
      },
      healthEvent: {
        findFirst: jest.fn(),
        create: jest.fn(async () =>
          healthEvent(HealthEventType.meal, DataSourceType.vision_ai),
        ),
      },
      mealLog: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn(async (cb: any) => cb(tx)) };
    const service = new NutritionService(prisma as any);
    const dto: CreateMealDto = {
      eventType: HealthEventType.meal,
      sourceType: DataSourceType.vision_ai,
      startedAt: '2026-05-25T08:00:00+09:00',
      timezone: 'Asia/Seoul',
      mealType: 'breakfast',
      totalKcal: 520,
      items: [{ name: 'rice', kcal: 300 }],
    };

    const result = await service.createMeal(USER, dto);

    expect(result.eventType).toBe(HealthEventType.meal);
    expect(result.sourceType).toBe(DataSourceType.vision_ai);
    expect(tx.mealLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        healthEventId: 'he-meal-1',
        mealType: 'breakfast',
        totalKcal: 520,
        analysisStatus: 'analyzed',
        foodItems: {
          create: [
            expect.objectContaining({
              name: 'rice',
              kcal: 300,
            }),
          ],
        },
      }),
    });
  });

  it('creates beverage logs and summarizes beverage intake', async () => {
    const tx = {
      dataSource: {
        findFirst: jest.fn(async () => ({ id: 'src-1' })),
        create: jest.fn(),
      },
      healthEvent: {
        findFirst: jest.fn(),
        create: jest.fn(async () =>
          healthEvent(HealthEventType.beverage, DataSourceType.label_scan),
        ),
      },
      beverageLog: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(async (cb: any) => cb(tx)),
      beverageLog: {
        findMany: jest.fn(async () => [
          { volumeMl: 355, kcal: 140, sugarG: 32, caffeineMg: 0 },
          { volumeMl: 500, kcal: null, sugarG: 0, caffeineMg: 80 },
        ]),
      },
    };
    const service = new NutritionService(prisma as any);
    const dto: CreateBeverageDto = {
      eventType: HealthEventType.beverage,
      sourceType: DataSourceType.label_scan,
      startedAt: '2026-05-25T12:00:00+09:00',
      timezone: 'Asia/Seoul',
      beverageType: 'coffee',
      name: 'cold brew',
      volumeMl: 500,
      caffeineMg: 80,
    };

    const created = await service.createBeverage(USER, dto);
    const summary = await service.getBeverageSummary(USER, {});

    expect(created.eventType).toBe(HealthEventType.beverage);
    expect(tx.beverageLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        healthEventId: 'he-beverage-1',
        beverageType: 'coffee',
        name: 'cold brew',
        analysisStatus: 'analyzed',
      }),
    });
    expect(summary).toEqual({
      from: null,
      to: null,
      recordCount: 2,
      totalVolumeMl: 855,
      totalKcal: 140,
      totalSugarG: 32,
      totalCaffeineMg: 80,
    });
  });
});
