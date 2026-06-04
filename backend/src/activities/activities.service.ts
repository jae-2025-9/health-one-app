import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DateRangeQueryDto } from '../common/dto/date-range-query.dto';
import { HealthEventType } from '../common/enums';
import { createHealthEvent } from '../common/health-events/health-event.factory';
import { mapHealthEvent } from '../common/health-events/health-event.mapper';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateActivityDto) {
    const event = await this.prisma.$transaction(async (tx) => {
      const healthEvent = await createHealthEvent(
        tx,
        userId,
        HealthEventType.activity,
        dto,
      );
      await tx.activityRecord.create({
        data: {
          healthEventId: healthEvent.id,
          steps: dto.steps ?? null,
          activeMinutes: dto.activeMinutes ?? null,
          activeKcal: dto.activeKcal ?? null,
          workoutType: dto.workoutType ?? null,
          distanceMeters: dto.distanceMeters ?? null,
        },
      });
      return healthEvent;
    });

    return mapHealthEvent(event);
  }

  async getSummary(userId: string, query: DateRangeQueryDto) {
    const rows = await this.prisma.activityRecord.findMany({
      where: { healthEvent: { userId, startedAt: dateWhere(query) } },
      include: { healthEvent: true },
    });

    return {
      from: query.from ?? null,
      to: query.to ?? null,
      recordCount: rows.length,
      totalSteps: sum(rows, (row) => row.steps),
      totalActiveMinutes: sum(rows, (row) => row.activeMinutes),
      totalActiveKcal: sum(rows, (row) => row.activeKcal),
      totalDistanceMeters: sum(rows, (row) => row.distanceMeters),
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
