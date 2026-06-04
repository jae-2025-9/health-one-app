import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface ActivityRow {
  totalSteps: number | null;
  totalActiveMinutes: number | null;
  totalActiveKcal: number | null;
}

export interface SleepRow {
  totalMinutes: number | null;
  deepSleepMinutes: number | null;
  remSleepMinutes: number | null;
  sleepScore: number | null;
}

export interface NutritionRow {
  totalKcal: number | null;
  totalCarbsG: number | null;
  totalProteinG: number | null;
  totalFatG: number | null;
  mealCount: number;
}

export interface HydrationRow {
  totalVolumeMl: number | null;
  totalCaffeineMg: number | null;
  totalSugarG: number | null;
}

export interface DailyIntakesRow {
  scheduledCount: number;
  takenCount: number;
  skippedCount: number;
}

export interface DailyRemindersRow {
  scheduledCount: number;
  sentCount: number;
  failedCount: number;
}

export interface WeeklyActivityRow {
  totalSteps: number | null;
  avgActiveMinutes: number | null;
  totalActiveKcal: number | null;
  activeDays: number;
}

export interface WeeklySleepRow {
  avgTotalMinutes: number | null;
  avgSleepScore: number | null;
  recordedDays: number;
}

export interface WeeklyNutritionRow {
  avgTotalKcal: number | null;
  recordedDays: number;
}

export interface WeeklyHydrationRow {
  avgVolumeMl: number | null;
  avgCaffeineMg: number | null;
}

export interface WeeklyIntakesRow {
  totalScheduled: number;
  totalTaken: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async daily(userId: string, dateParam?: string) {
    const timezone = await this.getUserTimezone(userId);
    const dateStr = dateParam ?? this.todayInTz(timezone);

    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'date 형식이 올바르지 않습니다 (YYYY-MM-DD).',
      });
    }

    const [activity, sleep, nutrition, hydration, intakes, reminders] =
      await Promise.all([
        this.queryDailyActivity(userId, timezone, dateStr),
        this.queryDailySleep(userId, timezone, dateStr),
        this.queryDailyNutrition(userId, timezone, dateStr),
        this.queryDailyHydration(userId, timezone, dateStr),
        this.queryDailyIntakes(userId, timezone, dateStr),
        this.queryDailyReminders(userId, timezone, dateStr),
      ]);

    return { date: dateStr, timezone, activity, sleep, nutrition, hydration, intakes, reminders };
  }

  async weekly(userId: string, weekStartParam?: string) {
    const weekStart = weekStartParam ?? this.currentWeekMonday();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'weekStart 형식이 올바르지 않습니다 (YYYY-MM-DD).',
      });
    }

    const weekStartDate = new Date(`${weekStart}T00:00:00Z`);
    if (weekStartDate.getUTCDay() !== 1) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'weekStart는 월요일(Monday) 날짜여야 합니다.',
      });
    }

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];

    const timezone = await this.getUserTimezone(userId);

    const [activity, sleep, nutrition, hydration, intakes] = await Promise.all([
      this.queryWeeklyActivity(userId, timezone, weekStart, weekEnd),
      this.queryWeeklySleep(userId, timezone, weekStart, weekEnd),
      this.queryWeeklyNutrition(userId, timezone, weekStart, weekEnd),
      this.queryWeeklyHydration(userId, timezone, weekStart, weekEnd),
      this.queryWeeklyIntakes(userId, timezone, weekStart, weekEnd),
    ]);

    return { weekStart, weekEnd, timezone, activity, sleep, nutrition, hydration, intakes };
  }

  private async getUserTimezone(userId: string): Promise<string> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    return profile?.timezone ?? 'Asia/Seoul';
  }

  private todayInTz(tz: string): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private currentWeekMonday(): string {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + diff);
    return monday.toISOString().split('T')[0];
  }

  private async queryDailyActivity(userId: string, tz: string, dateStr: string) {
    const rows = await this.prisma.$queryRaw<ActivityRow[]>`
      SELECT
        SUM(ar.steps)::int                AS "totalSteps",
        SUM(ar.active_minutes)::int       AS "totalActiveMinutes",
        SUM(ar.active_kcal)::float        AS "totalActiveKcal"
      FROM health_events he
      JOIN activity_records ar ON ar.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) = ${dateStr}::date
    `;
    const r = rows[0];
    if (!r || (r.totalSteps === null && r.totalActiveMinutes === null && r.totalActiveKcal === null)) return null;
    return r;
  }

  private async queryDailySleep(userId: string, tz: string, dateStr: string) {
    const rows = await this.prisma.$queryRaw<SleepRow[]>`
      SELECT
        SUM(sr.total_minutes)::int        AS "totalMinutes",
        SUM(sr.deep_sleep_minutes)::int   AS "deepSleepMinutes",
        SUM(sr.rem_sleep_minutes)::int    AS "remSleepMinutes",
        AVG(sr.sleep_score)::float        AS "sleepScore"
      FROM health_events he
      JOIN sleep_records sr ON sr.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) = ${dateStr}::date
    `;
    const r = rows[0];
    if (!r || (r.totalMinutes === null && r.sleepScore === null)) return null;
    return r;
  }

  private async queryDailyNutrition(userId: string, tz: string, dateStr: string) {
    const rows = await this.prisma.$queryRaw<NutritionRow[]>`
      SELECT
        SUM(ml.total_kcal)::float         AS "totalKcal",
        SUM(ml.carbs_g)::float            AS "totalCarbsG",
        SUM(ml.protein_g)::float          AS "totalProteinG",
        SUM(ml.fat_g)::float              AS "totalFatG",
        COUNT(*)::int                     AS "mealCount"
      FROM health_events he
      JOIN meal_logs ml ON ml.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) = ${dateStr}::date
    `;
    const r = rows[0];
    if (!r || r.mealCount === 0) return null;
    return r;
  }

  private async queryDailyHydration(userId: string, tz: string, dateStr: string) {
    const rows = await this.prisma.$queryRaw<HydrationRow[]>`
      SELECT
        SUM(bl.volume_ml)::float          AS "totalVolumeMl",
        SUM(bl.caffeine_mg)::float        AS "totalCaffeineMg",
        SUM(bl.sugar_g)::float            AS "totalSugarG"
      FROM health_events he
      JOIN beverage_logs bl ON bl.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) = ${dateStr}::date
    `;
    const r = rows[0];
    if (!r || (r.totalVolumeMl === null && r.totalCaffeineMg === null && r.totalSugarG === null)) return null;
    return r;
  }

  private async queryDailyIntakes(userId: string, tz: string, dateStr: string) {
    const rows = await this.prisma.$queryRaw<DailyIntakesRow[]>`
      SELECT
        COUNT(*)::int                                               AS "scheduledCount",
        (COUNT(*) FILTER (WHERE il.status = 'taken'))::int         AS "takenCount",
        (COUNT(*) FILTER (WHERE il.status = 'skipped'))::int       AS "skippedCount"
      FROM health_events he
      JOIN intake_logs il ON il.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) = ${dateStr}::date
    `;
    const r = rows[0];
    if (!r || r.scheduledCount === 0) return null;
    return r;
  }

  private async queryDailyReminders(userId: string, tz: string, dateStr: string) {
    const rows = await this.prisma.$queryRaw<DailyRemindersRow[]>`
      SELECT
        COUNT(*)::int                                               AS "scheduledCount",
        (COUNT(*) FILTER (WHERE nl.status = 'sent'))::int          AS "sentCount",
        (COUNT(*) FILTER (WHERE nl.status = 'failed'))::int        AS "failedCount"
      FROM notification_logs nl
      WHERE nl.user_id = ${userId}::uuid
        AND DATE(nl.scheduled_at AT TIME ZONE ${tz}) = ${dateStr}::date
    `;
    const r = rows[0];
    if (!r || r.scheduledCount === 0) return null;
    return r;
  }

  private async queryWeeklyActivity(userId: string, tz: string, weekStart: string, weekEnd: string) {
    const rows = await this.prisma.$queryRaw<WeeklyActivityRow[]>`
      SELECT
        SUM(ar.steps)::int                                              AS "totalSteps",
        AVG(ar.active_minutes)::float                                   AS "avgActiveMinutes",
        SUM(ar.active_kcal)::float                                      AS "totalActiveKcal",
        COUNT(DISTINCT DATE(he.started_at AT TIME ZONE ${tz}))::int    AS "activeDays"
      FROM health_events he
      JOIN activity_records ar ON ar.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) >= ${weekStart}::date
        AND DATE(he.started_at AT TIME ZONE ${tz}) <= ${weekEnd}::date
    `;
    const r = rows[0];
    if (!r || r.activeDays === 0) return null;
    return r;
  }

  private async queryWeeklySleep(userId: string, tz: string, weekStart: string, weekEnd: string) {
    const rows = await this.prisma.$queryRaw<WeeklySleepRow[]>`
      SELECT
        AVG(sr.total_minutes)::float                                    AS "avgTotalMinutes",
        AVG(sr.sleep_score)::float                                      AS "avgSleepScore",
        COUNT(DISTINCT DATE(he.started_at AT TIME ZONE ${tz}))::int    AS "recordedDays"
      FROM health_events he
      JOIN sleep_records sr ON sr.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) >= ${weekStart}::date
        AND DATE(he.started_at AT TIME ZONE ${tz}) <= ${weekEnd}::date
    `;
    const r = rows[0];
    if (!r || r.recordedDays === 0) return null;
    return r;
  }

  private async queryWeeklyNutrition(userId: string, tz: string, weekStart: string, weekEnd: string) {
    const rows = await this.prisma.$queryRaw<WeeklyNutritionRow[]>`
      SELECT
        AVG(ml.total_kcal)::float                                       AS "avgTotalKcal",
        COUNT(DISTINCT DATE(he.started_at AT TIME ZONE ${tz}))::int    AS "recordedDays"
      FROM health_events he
      JOIN meal_logs ml ON ml.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) >= ${weekStart}::date
        AND DATE(he.started_at AT TIME ZONE ${tz}) <= ${weekEnd}::date
    `;
    const r = rows[0];
    if (!r || r.recordedDays === 0) return null;
    return r;
  }

  private async queryWeeklyHydration(userId: string, tz: string, weekStart: string, weekEnd: string) {
    const rows = await this.prisma.$queryRaw<WeeklyHydrationRow[]>`
      SELECT
        AVG(bl.volume_ml)::float    AS "avgVolumeMl",
        AVG(bl.caffeine_mg)::float  AS "avgCaffeineMg"
      FROM health_events he
      JOIN beverage_logs bl ON bl.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) >= ${weekStart}::date
        AND DATE(he.started_at AT TIME ZONE ${tz}) <= ${weekEnd}::date
    `;
    const r = rows[0];
    if (!r || (r.avgVolumeMl === null && r.avgCaffeineMg === null)) return null;
    return r;
  }

  private async queryWeeklyIntakes(userId: string, tz: string, weekStart: string, weekEnd: string) {
    const rows = await this.prisma.$queryRaw<WeeklyIntakesRow[]>`
      SELECT
        COUNT(*)::int                                               AS "totalScheduled",
        (COUNT(*) FILTER (WHERE il.status = 'taken'))::int         AS "totalTaken"
      FROM health_events he
      JOIN intake_logs il ON il.health_event_id = he.id
      WHERE he.user_id = ${userId}::uuid
        AND DATE(he.started_at AT TIME ZONE ${tz}) >= ${weekStart}::date
        AND DATE(he.started_at AT TIME ZONE ${tz}) <= ${weekEnd}::date
    `;
    const r = rows[0];
    if (!r || r.totalScheduled === 0) return null;
    const adherenceRate =
      r.totalScheduled > 0
        ? Math.round((r.totalTaken / r.totalScheduled) * 1000) / 1000
        : null;
    return { totalScheduled: r.totalScheduled, totalTaken: r.totalTaken, adherenceRate };
  }
}
