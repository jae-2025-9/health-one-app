import { DataSourceType, HealthEventType } from '../common/enums';
import { CreateSleepRecordDto } from './dto/create-sleep-record.dto';
import { SleepRecordsService } from './sleep-records.service';

const USER = 'user-1';

function healthEvent() {
  return {
    id: 'he-sleep-1',
    eventType: HealthEventType.sleep,
    sourceId: 'src-1',
    externalRecordId: null,
    startedAt: new Date('2026-05-25T22:30:00Z'),
    endedAt: new Date('2026-05-26T06:30:00Z'),
    timezone: 'Asia/Seoul',
    confidenceScore: 1,
    rawPayload: {},
    createdAt: new Date('2026-05-26T06:30:00Z'),
    source: { sourceType: DataSourceType.manual },
  };
}

describe('SleepRecordsService', () => {
  it('creates a sleep record attached to the frozen health event hub', async () => {
    const tx = {
      dataSource: {
        findFirst: jest.fn(async () => ({ id: 'src-1' })),
        create: jest.fn(),
      },
      healthEvent: {
        findFirst: jest.fn(),
        create: jest.fn(async () => healthEvent()),
      },
      sleepRecord: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn(async (cb: any) => cb(tx)) };
    const service = new SleepRecordsService(prisma as any);
    const dto: CreateSleepRecordDto = {
      eventType: HealthEventType.sleep,
      sourceType: DataSourceType.manual,
      startedAt: '2026-05-25T22:30:00+09:00',
      endedAt: '2026-05-26T06:30:00+09:00',
      timezone: 'Asia/Seoul',
      totalMinutes: 480,
      deepSleepMinutes: 95,
      sleepScore: 82,
    };

    const result = await service.create(USER, dto);

    expect(result.eventType).toBe(HealthEventType.sleep);
    expect(result.sourceType).toBe(DataSourceType.manual);
    expect(tx.sleepRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        healthEventId: 'he-sleep-1',
        totalMinutes: 480,
        deepSleepMinutes: 95,
        sleepScore: 82,
      }),
    });
  });

  it('summarizes total and average sleep metrics', async () => {
    const prisma = {
      sleepRecord: {
        findMany: jest.fn(async () => [
          {
            totalMinutes: 420,
            awakeMinutes: 20,
            deepSleepMinutes: 80,
            remSleepMinutes: 70,
            sleepScore: 80,
          },
          {
            totalMinutes: 480,
            awakeMinutes: 15,
            deepSleepMinutes: 100,
            remSleepMinutes: 90,
            sleepScore: null,
          },
        ]),
      },
    };
    const service = new SleepRecordsService(prisma as any);

    const result = await service.getSummary(USER, {});

    expect(result).toEqual({
      from: null,
      to: null,
      recordCount: 2,
      totalMinutes: 900,
      averageMinutes: 450,
      averageSleepScore: 80,
      totalAwakeMinutes: 35,
      totalDeepSleepMinutes: 180,
      totalRemSleepMinutes: 160,
    });
  });
});
