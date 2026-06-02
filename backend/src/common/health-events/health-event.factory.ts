import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HealthEventCreateDto } from '../dto/health-event-create.dto';
import { DataSourceType, HealthEventType } from '../enums';

type Tx = Prisma.TransactionClient;

/**
 * Resolves a `data_sources.id` from the request's `sourceType` (+ optional
 * externalRecordId), find-or-creating the user's source row. Mirrors §G:
 * "request shape (sourceType) ≠ table shape (source_id)".
 */
async function resolveSourceId(
  tx: Tx,
  userId: string,
  sourceType: DataSourceType,
): Promise<string> {
  const existing = await tx.dataSource.findFirst({
    where: { userId, sourceType },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing.id;

  const created = await tx.dataSource.create({
    data: {
      userId,
      sourceType,
      displayName: sourceType,
      authorizedAt: new Date(),
    },
  });
  return created.id;
}

/**
 * Creates the common `health_events` row for an L3 detail event (intake /
 * cosmetic_usage), enforcing the correct `event_type`. Honors the dedupe
 * contract: a duplicate (source_id, external_record_id) raises 409 CONFLICT
 * to match `health_events_source_external_uidx`.
 */
export async function createHealthEvent(
  tx: Tx,
  userId: string,
  eventType: HealthEventType,
  dto: HealthEventCreateDto,
) {
  const sourceId = await resolveSourceId(tx, userId, dto.sourceType);

  if (dto.externalRecordId) {
    const dup = await tx.healthEvent.findFirst({
      where: { sourceId, externalRecordId: dto.externalRecordId },
    });
    if (dup) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: '이미 동기화된 이벤트입니다.',
      });
    }
  }

  try {
    // include `source` so the mapper can surface the contract-required
    // `sourceType` (the table stores only source_id — §G request≠table shape).
    return await tx.healthEvent.create({
      data: {
        userId,
        eventType,
        sourceId,
        externalRecordId: dto.externalRecordId ?? null,
        startedAt: new Date(dto.startedAt),
        endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
        timezone: dto.timezone,
        confidenceScore: dto.confidenceScore ?? 1,
        rawPayload: (dto.rawPayload ?? {}) as Prisma.InputJsonValue,
      },
      include: { source: true },
    });
  } catch (err) {
    // The find-or-create dedupe check above is racy; the real guard is the
    // unique index health_events_source_external_uidx. Map its P2002 to the
    // contract's 409 instead of a raw 500.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: '이미 동기화된 이벤트입니다.',
      });
    }
    throw err;
  }
}
