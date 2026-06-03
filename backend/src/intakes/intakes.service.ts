import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HealthEventType, IntakeItemType } from '../common/enums';
import { createHealthEvent } from '../common/health-events/health-event.factory';
import { mapHealthEvent } from '../common/health-events/health-event.mapper';
import { CreateIntakeItemDto } from './dto/create-intake-item.dto';
import { CreateIntakeLogDto } from './dto/create-intake-log.dto';

@Injectable()
export class IntakesService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /intakes/items — register a medication or supplement. */
  async createItem(userId: string, dto: CreateIntakeItemDto) {
    const data = {
      userId,
      name: dto.name,
      ingredientName: dto.ingredientName ?? null,
      doseAmount: dto.doseAmount ?? null,
      instructions: dto.instructions ?? null,
    };

    if (dto.itemType === IntakeItemType.medication) {
      const item = await this.prisma.medicationItem.create({ data });
      return this.mapItem(IntakeItemType.medication, item);
    }
    const item = await this.prisma.supplementItem.create({ data });
    return this.mapItem(IntakeItemType.supplement, item);
  }

  /** POST /intakes/logs — record an actual intake (creates a health_event + intake_log). */
  async createLog(userId: string, dto: CreateIntakeLogDto) {
    if (!dto.medicationItemId && !dto.supplementItemId) {
      // mirrors DB constraint intake_logs_has_item
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'medicationItemId 또는 supplementItemId 중 하나는 필요합니다.',
      });
    }
    await this.assertItemsOwned(userId, dto.medicationItemId, dto.supplementItemId);

    const event = await this.prisma.$transaction(async (tx) => {
      const healthEvent = await createHealthEvent(
        tx,
        userId,
        HealthEventType.intake,
        dto,
      );
      await tx.intakeLog.create({
        data: {
          healthEventId: healthEvent.id,
          medicationItemId: dto.medicationItemId ?? null,
          supplementItemId: dto.supplementItemId ?? null,
          takenAt: new Date(dto.takenAt),
          status: dto.status,
          note: dto.note ?? null,
        },
      });
      return healthEvent;
    });

    return mapHealthEvent(event);
  }

  /** GET /intakes/schedule?date= — intakes recorded/scheduled for a date. */
  async getSchedule(userId: string, date?: string) {
    const day = date ? new Date(`${date}T00:00:00`) : new Date();
    if (Number.isNaN(day.getTime())) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'date 형식이 올바르지 않습니다 (YYYY-MM-DD).',
      });
    }
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const logs = await this.prisma.intakeLog.findMany({
      where: {
        takenAt: { gte: start, lt: end },
        healthEvent: { userId },
      },
      include: { medicationItem: true, supplementItem: true },
      orderBy: { takenAt: 'asc' },
    });

    return logs.map((log) => ({
      healthEventId: log.healthEventId,
      itemType: log.medicationItemId ? 'medication' : 'supplement',
      itemId: log.medicationItemId ?? log.supplementItemId,
      itemName: log.medicationItem?.name ?? log.supplementItem?.name ?? null,
      takenAt: log.takenAt.toISOString(),
      status: log.status,
      note: log.note,
    }));
  }

  private async assertItemsOwned(
    userId: string,
    medicationItemId?: string | null,
    supplementItemId?: string | null,
  ): Promise<void> {
    if (medicationItemId) {
      const med = await this.prisma.medicationItem.findFirst({
        where: { id: medicationItemId, userId },
      });
      if (!med) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: '약 품목을 찾을 수 없습니다.',
        });
      }
    }
    if (supplementItemId) {
      const sup = await this.prisma.supplementItem.findFirst({
        where: { id: supplementItemId, userId },
      });
      if (!sup) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: '영양제 품목을 찾을 수 없습니다.',
        });
      }
    }
  }

  private mapItem(
    itemType: IntakeItemType,
    item: {
      id: string;
      name: string;
      ingredientName: string | null;
      doseAmount: string | null;
      instructions: string | null;
      createdAt: Date;
    },
  ) {
    return {
      id: item.id,
      itemType,
      name: item.name,
      ingredientName: item.ingredientName,
      doseAmount: item.doseAmount,
      instructions: item.instructions,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
