import { DataSourceType, HealthEventType } from '../common/enums';
import { CreateBeverageDto } from './dto/create-beverage.dto';
import { CreateMealDto } from './dto/create-meal.dto';
import { ImageAnalysisRequestDto } from './dto/image-analysis-request.dto';

export const NUTRITION_SAFETY_NOTICE =
  'AI 분석 결과는 사진/라벨 기반 추정값이며 의료 진단이 아닙니다. 알레르기, 질환, 식이 제한이 있다면 전문가와 상담하세요.';

export function analyzeMealImage(dto: ImageAnalysisRequestDto): CreateMealDto {
  const startedAt = dto.takenAt ?? new Date().toISOString();
  return {
    eventType: HealthEventType.meal,
    sourceType: DataSourceType.vision_ai,
    startedAt,
    timezone: dto.timezone ?? 'Asia/Seoul',
    confidenceScore: 0.72,
    rawPayload: { imageUrl: dto.imageUrl },
    mealType: guessMealType(startedAt),
    totalKcal: 620,
    carbsG: 74,
    proteinG: 28,
    fatG: 19,
    items: [
      {
        name: 'mixed meal',
        servingAmount: 1,
        servingUnit: 'plate',
        kcal: 620,
        carbsG: 74,
        proteinG: 28,
        fatG: 19,
        confidenceScore: 0.72,
      },
    ],
  };
}

export function analyzeBeverageLabel(dto: ImageAnalysisRequestDto): CreateBeverageDto {
  return {
    eventType: HealthEventType.beverage,
    sourceType: DataSourceType.label_scan,
    startedAt: dto.takenAt ?? new Date().toISOString(),
    timezone: dto.timezone ?? 'Asia/Seoul',
    confidenceScore: 0.78,
    rawPayload: { imageUrl: dto.imageUrl },
    beverageType: 'packaged_drink',
    name: 'label scan beverage',
    volumeMl: 355,
    kcal: 140,
    sugarG: 32,
    caffeineMg: 0,
  };
}

function guessMealType(iso: string): string {
  const hour = new Date(iso).getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}
