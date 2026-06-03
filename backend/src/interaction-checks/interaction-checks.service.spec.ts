import { NotFoundException } from '@nestjs/common';
import { InteractionChecksService } from './interaction-checks.service';
import { CreateInteractionCheckDto } from './dto/create-interaction-check.dto';
import { IntakeItemType } from '../common/enums';

const USER = 'user-1';

function buildPrismaMock() {
  const tx = {
    interactionCheck: {
      create: jest.fn(async ({ data }: any) => ({
        id: 'chk-1',
        riskLevel: data.riskLevel,
        summary: data.summary,
        recommendation: data.recommendation,
        evidencePayload: data.evidencePayload,
        createdAt: new Date('2026-05-25T00:00:00Z'),
      })),
    },
    interactionCheckItem: { createMany: jest.fn(async () => ({ count: 2 })) },
  };
  const prisma = {
    medicationItem: { findFirst: jest.fn() },
    supplementItem: { findFirst: jest.fn() },
    interactionCheck: { findFirst: jest.fn() },
    $transaction: jest.fn(async (cb: any) => cb(tx)),
  };
  return { prisma, tx };
}

const dto: CreateInteractionCheckDto = {
  items: [
    { itemType: IntakeItemType.supplement, itemId: '11111111-1111-1111-1111-111111111111' },
    { itemType: IntakeItemType.supplement, itemId: '22222222-2222-2222-2222-222222222222' },
  ],
};

describe('InteractionChecksService', () => {
  it('always returns a safetyNotice and persists the check + items', async () => {
    const { prisma, tx } = buildPrismaMock();
    prisma.supplementItem.findFirst
      .mockResolvedValueOnce({ id: dto.items[0].itemId, name: '와파린', ingredientName: 'Warfarin' })
      .mockResolvedValueOnce({ id: dto.items[1].itemId, name: '종합비타민', ingredientName: 'Vitamin K' });

    const service = new InteractionChecksService(prisma as any);
    const result = await service.create(USER, dto);

    expect(result.safetyNotice).toBeTruthy();
    expect(result.safetyNotice).toContain('전문가');
    expect(result.riskLevel).toBe('high');
    expect(tx.interactionCheck.create).toHaveBeenCalledTimes(1);
    expect(tx.interactionCheckItem.createMany).toHaveBeenCalledTimes(1);
    const createManyArg: any = (tx.interactionCheckItem.createMany as jest.Mock)
      .mock.calls[0][0];
    expect(createManyArg.data).toHaveLength(2);
  });

  it('rejects an item that does not belong to the user', async () => {
    const { prisma } = buildPrismaMock();
    prisma.supplementItem.findFirst.mockResolvedValue(null);
    const service = new InteractionChecksService(prisma as any);
    await expect(service.create(USER, dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne throws NOT_FOUND when missing', async () => {
    const { prisma } = buildPrismaMock();
    prisma.interactionCheck.findFirst.mockResolvedValue(null);
    const service = new InteractionChecksService(prisma as any);
    await expect(service.findOne(USER, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne maps a stored row and adds safetyNotice', async () => {
    const { prisma } = buildPrismaMock();
    prisma.interactionCheck.findFirst.mockResolvedValue({
      id: 'chk-1',
      riskLevel: 'medium',
      summary: 's',
      recommendation: 'r',
      evidencePayload: [{ items: ['a', 'b'], riskLevel: 'medium', note: 'n' }],
      createdAt: new Date('2026-05-25T00:00:00Z'),
    });
    const service = new InteractionChecksService(prisma as any);
    const result = await service.findOne(USER, 'chk-1');
    expect(result.riskLevel).toBe('medium');
    expect(result.evidence).toHaveLength(1);
    expect(result.safetyNotice).toBeTruthy();
    expect(result.createdAt).toBe('2026-05-25T00:00:00.000Z');
  });
});
