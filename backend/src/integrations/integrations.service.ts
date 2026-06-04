import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { HealthSyncRequestDto } from './dto/health-sync-request.dto';

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async healthSync(userId: string, dto: HealthSyncRequestDto) {
    const source = await this.resolveDataSource(userId, dto);

    let inserted = 0;
    let deduplicated = 0;
    let failed = 0;

    for (const event of dto.events) {
      try {
        if (event.externalRecordId) {
          const exists = await this.prisma.healthEvent.findFirst({
            where: { sourceId: source.id, externalRecordId: event.externalRecordId },
            select: { id: true },
          });
          if (exists) {
            deduplicated++;
            continue;
          }
        }

        await this.prisma.healthEvent.create({
          data: {
            userId,
            eventType: event.eventType,
            sourceId: source.id,
            externalRecordId: event.externalRecordId ?? null,
            startedAt: new Date(event.startedAt),
            endedAt: event.endedAt ? new Date(event.endedAt) : null,
            timezone: event.timezone,
            confidenceScore: event.confidenceScore ?? 1,
            rawPayload: (event.rawPayload ?? {}) as Prisma.InputJsonValue,
          },
        });
        inserted++;
      } catch (err) {
        // health_events_source_external_uidx race condition → dedup
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          deduplicated++;
        } else {
          failed++;
        }
      }
    }

    return {
      sourceId: source.id,
      sourceType: dto.sourceType,
      received: dto.events.length,
      inserted,
      deduplicated,
      failed,
    };
  }

  private async resolveDataSource(
    userId: string,
    dto: Pick<HealthSyncRequestDto, 'sourceType' | 'externalAccountId'>,
  ) {
    const existing = await this.prisma.dataSource.findFirst({
      where: {
        userId,
        sourceType: dto.sourceType,
        ...(dto.externalAccountId
          ? { externalAccountId: dto.externalAccountId }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) return existing;

    return this.prisma.dataSource.create({
      data: {
        userId,
        sourceType: dto.sourceType,
        displayName: dto.sourceType,
        externalAccountId: dto.externalAccountId ?? null,
        authorizedAt: new Date(),
      },
    });
  }
}
