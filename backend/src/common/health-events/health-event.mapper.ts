import { DataSource, HealthEvent } from '@prisma/client';

type HealthEventWithSource = HealthEvent & {
  source?: Pick<DataSource, 'sourceType'> | null;
};

/**
 * Maps a `health_events` row (with its `source` relation) to the contract
 * `HealthEvent` JSON shape: camelCase fields, ISO-8601 timestamps, numeric
 * confidenceScore. `sourceType` is contract-required (HealthEventCreate) and is
 * recovered from the joined data source, since the table stores only source_id.
 */
export function mapHealthEvent(
  row: HealthEventWithSource,
): Record<string, unknown> {
  return {
    id: row.id,
    eventType: row.eventType,
    sourceType: row.source?.sourceType ?? null,
    sourceId: row.sourceId,
    externalRecordId: row.externalRecordId,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    timezone: row.timezone,
    confidenceScore: Number(row.confidenceScore),
    rawPayload: row.rawPayload,
    createdAt: row.createdAt.toISOString(),
  };
}
