import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HealthEventType } from '../common/enums';
import { SAFETY_NOTICE } from '../common/safety/safety-notice';
import { createHealthEvent } from '../common/health-events/health-event.factory';
import { mapHealthEvent } from '../common/health-events/health-event.mapper';
import { AnalyzeIngredientsDto } from './dto/analyze-ingredients.dto';
import { CreateCosmeticUsageDto } from './dto/create-cosmetic-usage.dto';
import { analyzeIngredientText } from './ingredient-analyzer';

@Injectable()
export class CosmeticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /cosmetics/analyze-ingredients — analyze ingredient text (or accept an
   * image for later analysis), persisting a product + its ingredients so usage
   * logs can reference it.
   */
  async analyzeIngredients(userId: string, dto: AnalyzeIngredientsDto) {
    if (!dto.ingredientText && !dto.imageUrl) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'ingredientText 또는 imageUrl 중 하나는 필요합니다.',
      });
    }

    const analyzed = dto.ingredientText
      ? analyzeIngredientText(dto.ingredientText)
      : [];

    const product = await this.prisma.cosmeticProduct.create({
      data: {
        userId,
        name: dto.productName ?? '미지정 제품',
        brand: dto.brand ?? null,
        skinTypeTarget: dto.skinType ?? null,
        ingredients: {
          create: analyzed.map((a) => ({
            ingredientName: a.ingredientName,
            safetyLevel: a.safetyLevel,
            effectSummary: a.effectSummary,
            cautionSummary: a.cautionSummary,
          })),
        },
      },
      include: { ingredients: true },
    });

    const pendingImage = !dto.ingredientText && !!dto.imageUrl;
    return {
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      skinType: product.skinTypeTarget,
      ingredients: product.ingredients.map((ing) => ({
        ingredientName: ing.ingredientName,
        safetyLevel: ing.safetyLevel,
        effectSummary: ing.effectSummary,
        cautionSummary: ing.cautionSummary,
      })),
      // safety domain invariant: analysis responses carry safetyNotice
      safetyNotice: pendingImage
        ? `${SAFETY_NOTICE.cosmetic} 이미지 분석은 준비 중이라 성분이 아직 비어 있습니다.`
        : SAFETY_NOTICE.cosmetic,
    };
  }

  /** POST /cosmetics/usage-logs — record cosmetic usage (health_event + usage log). */
  async createUsageLog(userId: string, dto: CreateCosmeticUsageDto) {
    const product = await this.prisma.cosmeticProduct.findFirst({
      where: { id: dto.cosmeticProductId, userId },
    });
    if (!product) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '화장품 제품을 찾을 수 없습니다.',
      });
    }

    const event = await this.prisma.$transaction(async (tx) => {
      const healthEvent = await createHealthEvent(
        tx,
        userId,
        HealthEventType.cosmetic_usage,
        dto,
      );
      await tx.cosmeticUsageLog.create({
        data: {
          healthEventId: healthEvent.id,
          cosmeticProductId: dto.cosmeticProductId,
          bodyArea: dto.bodyArea ?? null,
          reactionNote: dto.reactionNote ?? null,
        },
      });
      return healthEvent;
    });

    return mapHealthEvent(event);
  }
}
