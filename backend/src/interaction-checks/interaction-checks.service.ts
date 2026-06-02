import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { IntakeItemType } from '../common/enums';
import { interactionSafetyNotice } from '../common/safety/safety-notice';
import { CreateInteractionCheckDto } from './dto/create-interaction-check.dto';
import { AnalyzableItem, analyzeInteractions } from './interaction-analyzer';

@Injectable()
export class InteractionChecksService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /interaction-checks — caution info (NOT diagnosis) for a combination. */
  async create(userId: string, dto: CreateInteractionCheckDto) {
    const resolved = await this.resolveItems(userId, dto);
    const analysis = analyzeInteractions(resolved.map((r) => r.analyzable));

    const check = await this.prisma.$transaction(async (tx) => {
      const created = await tx.interactionCheck.create({
        data: {
          userId,
          riskLevel: analysis.riskLevel,
          summary: analysis.summary,
          recommendation: analysis.recommendation,
          evidencePayload: analysis.evidence as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.interactionCheckItem.createMany({
        data: resolved.map((r) => ({
          interactionCheckId: created.id,
          medicationItemId:
            r.input.itemType === IntakeItemType.medication ? r.input.itemId : null,
          supplementItemId:
            r.input.itemType === IntakeItemType.supplement ? r.input.itemId : null,
          itemType: r.input.itemType,
        })),
      });
      return created;
    });

    return this.toResponse(check);
  }

  /** GET /interaction-checks/{id} — re-read a stored result. */
  async findOne(userId: string, id: string) {
    const check = await this.prisma.interactionCheck.findFirst({
      where: { id, userId },
    });
    if (!check) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '상호작용 확인 결과를 찾을 수 없습니다.',
      });
    }
    return this.toResponse(check);
  }

  private async resolveItems(userId: string, dto: CreateInteractionCheckDto) {
    return Promise.all(
      dto.items.map(async (input) => {
        const row =
          input.itemType === IntakeItemType.medication
            ? await this.prisma.medicationItem.findFirst({
                where: { id: input.itemId, userId },
              })
            : await this.prisma.supplementItem.findFirst({
                where: { id: input.itemId, userId },
              });
        if (!row) {
          throw new NotFoundException({
            code: 'NOT_FOUND',
            message: `품목을 찾을 수 없습니다: ${input.itemId}`,
          });
        }
        const analyzable: AnalyzableItem = {
          itemType: input.itemType,
          name: row.name,
          ingredientName: row.ingredientName,
        };
        return { input, analyzable };
      }),
    );
  }

  private toResponse(check: {
    id: string;
    riskLevel: string;
    summary: string;
    recommendation: string;
    evidencePayload: unknown;
    createdAt: Date;
  }) {
    return {
      id: check.id,
      riskLevel: check.riskLevel,
      summary: check.summary,
      recommendation: check.recommendation,
      evidence: Array.isArray(check.evidencePayload)
        ? check.evidencePayload
        : [],
      // safety domain invariant: every interaction response carries safetyNotice
      safetyNotice: interactionSafetyNotice(check.riskLevel),
      createdAt: check.createdAt.toISOString(),
    };
  }
}
