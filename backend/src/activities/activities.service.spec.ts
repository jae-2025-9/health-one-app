import { ActivitiesService } from './activities.service';
import { DataSourceType, HealthEventType } from '../common/enums';
import { CreateActivityDto } from './dto/create-activity.dto';

const USER = 'user-1';

function healthEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'he-activity-1',
    eventType: HealthEventType.activity,
    sourceId: 'src-1',
    externalRecordId: null,
    startedAt: new Date('2026-05-25T08:00:00Z'),
    endedAt: null,
    timezone: 'Asia/Seoul',
    confidenceScore: 1,
    rawPayload: {},
    createdAt: new Date('2026-05-25T08:00:00Z'),
    source: { sourceType: DataSourceType.manual },
    ...overrides,
  };
}

describe('ActivitiesService', () => {
  it('creates an activity through the common health_events hub', async () => {
    const tx = {
      dataSource: {
        findFirst: jest.fn(async () => ({ id: 'src-1' })),
        create: jest.fn(),
      },
      healthEvent: {
        findFirst: jest.fn(),
        create: jest.fn(async () => healthEvent()),
      },
      activityRecord: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn(async (cb: any) => cb(tx)) };
    const service = new ActivitiesService(prisma as any);
    const dto: CreateActivityDto = {
      eventType: HealthEventType.activity,
      sourceType: DataSourceType.manual,
      startedAt: '2026-05-25T08:00:00+09:00',
      timezone: 'Asia/Seoul',
      steps: 4200,
      activeMinutes: 35,
    };

    const result = await service.create(USER, dto);

    expect(result.eventType).toBe(HealthEventType.activity);
    expect(result.sourceType).toBe(DataSourceType.manual);
    expect(tx.healthEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER,
          eventType: HealthEventType.activity,
          sourceId: 'src-1',
        }),
        include: { source: true },
      }),
    );
    expect(tx.activityRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        healthEventId: 'he-activity-1',
        steps: 4200,
        activeMinutes: 35,
      }),
    });
  });

  it('summarizes activity records for the requested date range', async () => {
    const prisma = {
      activityRecord: {
        findMany: jest.fn(async () => [
          { steps: 1000, activeMinutes: 10, activeKcal: 80, distanceMeters: 900 },
          { steps: 2500, activeMinutes: 25, activeKcal: null, distanceMeters: 2100 },
        ]),
      },
    };
    const service = new ActivitiesService(prisma as any);

    const result = await service.getSummary(USER, {
      from: '2026-05-25T00:00:00+09:00',
      to: '2026-05-25T23:59:59+09:00',
    });

    expect(result).toEqual({
      from: '2026-05-25T00:00:00+09:00',
      to: '2026-05-25T23:59:59+09:00',
      recordCount: 2,
      totalSteps: 3500,
      totalActiveMinutes: 35,
      totalActiveKcal: 80,
      totalDistanceMeters: 3000,
    });
    expect(prisma.activityRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          healthEvent: expect.objectContaining({ userId: USER }),
        }),
      }),
    );
  });
});
