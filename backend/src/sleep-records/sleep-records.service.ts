import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DateRangeQueryDto } from '../common/dto/date-range-query.dto';
import { HealthEventType } from '../common/enums';
import { createHealthEvent } from '../common/health-events/health-event.factory';
import { mapHealthEvent } from '../common/health-events/health-event.mapper';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSleepRecordDto } from './dto/create-sleep-record.dto';

@Injectable()
export class SleepRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSleepRecordDto) {
    const event = await this.prisma.$transaction(async (tx) => {
      const healthEvent = await createHealthEvent(
        tx,
        userId,
        HealthEventType.sleep,
        dto,
      );
      await tx.sleepRecord.create({
        data: {
          healthEventId: healthEvent.id,
          totalMinutes: dto.totalMinutes,
          awakeMinutes: dto.awakeMinutes ?? null,
          deepSleepMinutes: dto.deepSleepMinutes ?? null,
          remSleepMinutes: dto.remSleepMinutes ?? null,
          sleepScore: dto.sleepScore ?? null,
          qualityNote: dto.qualityNote ?? null,
        },
      });
      return healthEvent;
    });

    return mapHealthEvent(event);
  }

  async getSummary(userId: string, query: DateRangeQueryDto) {
    const rows = await this.prisma.sleepRecord.findMany({
      where: { healthEvent: { userId, startedAt: dateWhere(query) } },
    });

    return {
      from: query.from ?? null,
      to: query.to ?? null,
      recordCount: rows.length,
      totalMinutes: sum(rows, (row) => row.totalMinutes),
      averageMinutes: average(rows, (row) => row.totalMinutes),
      averageSleepScore: average(rows, (row) => row.sleepScore),
      totalAwakeMinutes: sum(rows, (row) => row.awakeMinutes),
      totalDeepSleepMinutes: sum(rows, (row) => row.deepSleepMinutes),
      totalRemSleepMinutes: sum(rows, (row) => row.remSleepMinutes),
    };
  }
}

function dateWhere(query: DateRangeQueryDto) {
  const where: Prisma.DateTimeFilter = {};
  if (query.from) where.gte = new Date(query.from);
  if (query.to) where.lte = new Date(query.to);
  return Object.keys(where).length ? where : undefined;
}

function sum<T>(rows: T[], pick: (row: T) => unknown): number {
  return rows.reduce((total, row) => total + Number(pick(row) ?? 0), 0);
}

function average<T>(rows: T[], pick: (row: T) => unknown): number | null {
  const values = rows
    .map((row) => pick(row))
    .filter((value) => value != null)
    .map((value) => Number(value));
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}
