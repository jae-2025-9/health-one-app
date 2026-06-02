import { BadRequestException } from '@nestjs/common';
import { IntakesService } from './intakes.service';
import { CreateIntakeItemDto } from './dto/create-intake-item.dto';
import { CreateIntakeLogDto } from './dto/create-intake-log.dto';
import {
  DataSourceType,
  HealthEventType,
  IntakeItemType,
  IntakeStatus,
} from '../common/enums';

const USER = 'user-1';

describe('IntakesService', () => {
  it('createItem stores a medication and echoes itemType', async () => {
    const prisma = {
      medicationItem: {
        create: jest.fn(async ({ data }: any) => ({
          id: 'med-1',
          name: data.name,
          ingredientName: data.ingredientName,
          doseAmount: data.doseAmount,
          instructions: data.instructions,
          createdAt: new Date('2026-05-25T00:00:00Z'),
        })),
      },
      supplementItem: { create: jest.fn() },
    };
    const service = new IntakesService(prisma as any);
    const dto: CreateIntakeItemDto = {
      itemType: IntakeItemType.medication,
      name: '타이레놀',
    };
    const result = await service.createItem(USER, dto);
    expect(result.itemType).toBe(IntakeItemType.medication);
    expect(result.id).toBe('med-1');
    expect(prisma.medicationItem.create).toHaveBeenCalledTimes(1);
    expect(prisma.supplementItem.create).not.toHaveBeenCalled();
  });

  it('createLog returns a contract HealthEvent incl. required sourceType', async () => {
    const tx = {
      dataSource: {
        findFirst: jest.fn(async () => ({ id: 'src-1' })),
        create: jest.fn(),
      },
      healthEvent: {
        findFirst: jest.fn(),
        create: jest.fn(async () => ({
          id: 'he-1',
          eventType: 'intake',
          sourceId: 'src-1',
          externalRecordId: null,
          startedAt: new Date('2026-05-25T08:00:00Z'),
          endedAt: null,
          timezone: 'Asia/Seoul',
          confidenceScore: 1,
          rawPayload: {},
          createdAt: new Date('2026-05-25T08:00:00Z'),
          source: { sourceType: 'manual' },
        })),
      },
      intakeLog: { create: jest.fn() },
    };
    const prisma = {
      medicationItem: { findFirst: jest.fn(async () => ({ id: 'med-1' })) },
      supplementItem: { findFirst: jest.fn() },
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    };
    const service = new IntakesService(prisma as any);
    const dto: CreateIntakeLogDto = {
      eventType: HealthEventType.intake,
      sourceType: DataSourceType.manual,
      startedAt: '2026-05-25T08:00:00+09:00',
      timezone: 'Asia/Seoul',
      medicationItemId: 'med-1',
      takenAt: '2026-05-25T08:00:00+09:00',
      status: IntakeStatus.taken,
    };
    const result: any = await service.createLog(USER, dto);
    expect(result.id).toBe('he-1');
    expect(result.eventType).toBe('intake');
    expect(result.sourceType).toBe('manual'); // contract-required field
    expect(tx.intakeLog.create).toHaveBeenCalledTimes(1);
  });

  it('createLog requires at least one item id (mirrors intake_logs_has_item)', async () => {
    const service = new IntakesService({} as any);
    const dto: CreateIntakeLogDto = {
      eventType: HealthEventType.intake,
      sourceType: DataSourceType.manual,
      startedAt: '2026-05-25T08:00:00+09:00',
      timezone: 'Asia/Seoul',
      takenAt: '2026-05-25T08:00:00+09:00',
      status: IntakeStatus.taken,
    };
    await expect(service.createLog(USER, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('getSchedule rejects a malformed date', async () => {
    const service = new IntakesService({} as any);
    await expect(service.getSchedule(USER, 'not-a-date')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
