import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { PatchReminderDto } from './dto/patch-reminder.dto';

type ReminderRow = {
  id: string;
  userId: string;
  targetType: string;
  targetId: string | null;
  title: string;
  rrule: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rules = await this.prisma.reminderRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rules.map(mapRule);
  }

  async create(userId: string, dto: CreateReminderDto) {
    assertValidRrule(dto.rrule);
    const rule = await this.prisma.reminderRule.create({
      data: {
        userId,
        targetType: dto.targetType,
        targetId: dto.targetId ?? null,
        title: dto.title,
        rrule: dto.rrule,
        isActive: dto.isActive ?? true,
      },
    });
    return mapRule(rule);
  }

  async patch(userId: string, id: string, dto: PatchReminderDto) {
    const existing = await this.prisma.reminderRule.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: '알림 규칙을 찾을 수 없거나 본인 소유가 아닙니다.',
      });
    }
    if (dto.rrule !== undefined) assertValidRrule(dto.rrule);

    const updated = await this.prisma.reminderRule.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.rrule !== undefined && { rrule: dto.rrule }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return mapRule(updated);
  }
}

function assertValidRrule(rrule: string): void {
  if (!rrule.startsWith('RRULE:')) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'rrule은 RRULE: 로 시작하는 iCalendar 형식이어야 합니다.',
    });
  }
}

function mapRule(rule: ReminderRow) {
  return {
    id: rule.id,
    userId: rule.userId,
    targetType: rule.targetType,
    targetId: rule.targetId,
    title: rule.title,
    rrule: rule.rrule,
    isActive: rule.isActive,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}
