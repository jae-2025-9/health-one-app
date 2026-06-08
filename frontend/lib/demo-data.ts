import type {
  CreateReminderDto,
  DailyReport,
  DemoRawEvent,
  HealthSyncRequest,
  HealthSyncResult,
  PatchReminderDto,
  ReminderRule,
  WeeklyReport,
} from './types';

const DEMO_MODE_KEY = 'health-one-demo-mode';
const DEMO_REMINDERS_KEY = 'health-one-demo-reminders';
const USER_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_TODAY = '2026-06-06';
export const DEMO_WEEK_START = '2026-06-01';

type DemoDayFixture = {
  steps: number;
  activeMinutes: number;
  activeKcal: number;
  sleepMinutes: number;
  deepSleepMinutes: number;
  remSleepMinutes: number;
  sleepScore: number;
  kcal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  waterMl: number;
  caffeineMg: number;
  sugarG: number;
  intakeTaken: number;
  rawEvents: DemoRawEvent[];
};

const DEMO_DAILY_FIXTURES: Record<string, DemoDayFixture> = {
  '2026-06-01': buildFixture('2026-06-01', {
    steps: 6840,
    activeMinutes: 34,
    activeKcal: 315,
    sleepMinutes: 402,
    deepSleepMinutes: 78,
    remSleepMinutes: 86,
    sleepScore: 74,
    kcal: 1560,
    carbsG: 196,
    proteinG: 68,
    fatG: 42,
    waterMl: 1420,
    caffeineMg: 95,
    sugarG: 18,
    intakeTaken: 3,
  }),
  '2026-06-02': buildFixture('2026-06-02', {
    steps: 8120,
    activeMinutes: 46,
    activeKcal: 388,
    sleepMinutes: 431,
    deepSleepMinutes: 86,
    remSleepMinutes: 96,
    sleepScore: 81,
    kcal: 1685,
    carbsG: 205,
    proteinG: 74,
    fatG: 48,
    waterMl: 1680,
    caffeineMg: 120,
    sugarG: 24,
    intakeTaken: 3,
  }),
  '2026-06-03': buildFixture('2026-06-03', {
    steps: 9420,
    activeMinutes: 58,
    activeKcal: 462,
    sleepMinutes: 376,
    deepSleepMinutes: 64,
    remSleepMinutes: 79,
    sleepScore: 69,
    kcal: 1820,
    carbsG: 226,
    proteinG: 72,
    fatG: 56,
    waterMl: 1210,
    caffeineMg: 180,
    sugarG: 31,
    intakeTaken: 2,
  }),
  '2026-06-04': buildFixture('2026-06-04', {
    steps: 7650,
    activeMinutes: 43,
    activeKcal: 354,
    sleepMinutes: 448,
    deepSleepMinutes: 92,
    remSleepMinutes: 101,
    sleepScore: 84,
    kcal: 1515,
    carbsG: 178,
    proteinG: 79,
    fatG: 44,
    waterMl: 1940,
    caffeineMg: 70,
    sugarG: 11,
    intakeTaken: 3,
  }),
  '2026-06-05': buildFixture('2026-06-05', {
    steps: 10040,
    activeMinutes: 64,
    activeKcal: 518,
    sleepMinutes: 417,
    deepSleepMinutes: 82,
    remSleepMinutes: 94,
    sleepScore: 78,
    kcal: 1760,
    carbsG: 211,
    proteinG: 81,
    fatG: 53,
    waterMl: 1570,
    caffeineMg: 160,
    sugarG: 28,
    intakeTaken: 3,
  }),
  '2026-06-06': buildFixture('2026-06-06', {
    steps: 8432,
    activeMinutes: 50,
    activeKcal: 420,
    sleepMinutes: 450,
    deepSleepMinutes: 88,
    remSleepMinutes: 97,
    sleepScore: 82,
    kcal: 1650,
    carbsG: 198,
    proteinG: 76,
    fatG: 49,
    waterMl: 1700,
    caffeineMg: 34,
    sugarG: 7,
    intakeTaken: 3,
  }),
};

export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const flag = params.get('demo');
  if (flag === '1') {
    window.localStorage.setItem(DEMO_MODE_KEY, '1');
    return true;
  }
  if (flag === '0') {
    window.localStorage.setItem(DEMO_MODE_KEY, '0');
    return false;
  }

  const stored = window.localStorage.getItem(DEMO_MODE_KEY);
  if (stored === '1') return true;

  return true;
}

export function demoDailyReport(date = today()): DailyReport {
  const fixture = DEMO_DAILY_FIXTURES[date] ?? buildGeneratedFixture(date);

  return {
    date,
    timezone: 'Asia/Seoul',
    activity: {
      totalSteps: fixture.steps,
      totalActiveMinutes: fixture.activeMinutes,
      totalActiveKcal: fixture.activeKcal,
    },
    sleep: {
      totalMinutes: fixture.sleepMinutes,
      deepSleepMinutes: fixture.deepSleepMinutes,
      remSleepMinutes: fixture.remSleepMinutes,
      sleepScore: fixture.sleepScore,
    },
    nutrition: {
      totalKcal: fixture.kcal,
      totalCarbsG: fixture.carbsG,
      totalProteinG: fixture.proteinG,
      totalFatG: fixture.fatG,
      mealCount: 3,
    },
    hydration: {
      totalVolumeMl: fixture.waterMl,
      totalCaffeineMg: fixture.caffeineMg,
      totalSugarG: fixture.sugarG,
    },
    intakes: {
      scheduledCount: 3,
      takenCount: fixture.intakeTaken,
      skippedCount: 3 - fixture.intakeTaken,
    },
    reminders: {
      scheduledCount: 4,
      sentCount: 3,
      failedCount: 0,
    },
    demoRawEvents: fixture.rawEvents,
  };
}

export function demoWeeklyReport(weekStart = currentMonday()): WeeklyReport {
  const start = new Date(`${weekStart}T00:00:00+09:00`);
  const reports = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return demoDailyReport(toDate(date));
  });

  const weekEndDate = new Date(start);
  weekEndDate.setDate(start.getDate() + 6);

  const sum = (pick: (report: DailyReport) => number | null | undefined) =>
    reports.reduce((total, report) => total + (pick(report) ?? 0), 0);
  const avg = (pick: (report: DailyReport) => number | null | undefined) =>
    sum(pick) / reports.length;
  const totalScheduled = sum((report) => report.intakes?.scheduledCount);
  const totalTaken = sum((report) => report.intakes?.takenCount);

  return {
    weekStart,
    weekEnd: toDate(weekEndDate),
    timezone: 'Asia/Seoul',
    activity: {
      totalSteps: sum((report) => report.activity?.totalSteps),
      avgActiveMinutes: avg((report) => report.activity?.totalActiveMinutes),
      totalActiveKcal: sum((report) => report.activity?.totalActiveKcal),
      activeDays: 7,
    },
    sleep: {
      avgTotalMinutes: avg((report) => report.sleep?.totalMinutes),
      avgSleepScore: avg((report) => report.sleep?.sleepScore),
      recordedDays: 7,
    },
    nutrition: {
      avgTotalKcal: avg((report) => report.nutrition?.totalKcal),
      recordedDays: 7,
    },
    hydration: {
      avgVolumeMl: avg((report) => report.hydration?.totalVolumeMl),
      avgCaffeineMg: avg((report) => report.hydration?.totalCaffeineMg),
    },
    intakes: {
      totalScheduled,
      totalTaken,
      adherenceRate: totalScheduled > 0 ? totalTaken / totalScheduled : null,
    },
    dailyReports: reports,
    demoRawEvents: reports.flatMap((report) => report.demoRawEvents ?? []),
  };
}

export function demoReminderList(): ReminderRule[] {
  const stored = readStoredReminders();
  if (stored.length > 0) return stored;

  const initial: ReminderRule[] = [
    buildReminder({
      targetType: 'intake',
      title: '아침 오메가3 복용',
      rrule: 'RRULE:FREQ=DAILY;BYHOUR=9;BYMINUTE=0',
      isActive: true,
    }),
    buildReminder({
      targetType: 'hydration',
      title: '수분 섭취 체크',
      rrule: 'RRULE:FREQ=HOURLY;INTERVAL=2;BYHOUR=9,11,13,15,17,19',
      isActive: true,
    }),
    buildReminder({
      targetType: 'sleep',
      title: '취침 준비',
      rrule: 'RRULE:FREQ=DAILY;BYHOUR=23;BYMINUTE=0',
      isActive: false,
    }),
  ];
  writeStoredReminders(initial);
  return initial;
}

export function demoCreateReminder(dto: CreateReminderDto): ReminderRule {
  const reminder = buildReminder({
    targetType: dto.targetType,
    title: dto.title,
    rrule: dto.rrule,
    isActive: dto.isActive ?? true,
  });
  writeStoredReminders([reminder, ...demoReminderList()]);
  return reminder;
}

export function demoPatchReminder(id: string, dto: PatchReminderDto): ReminderRule {
  const next = demoReminderList().map((rule) =>
    rule.id === id
      ? { ...rule, ...dto, updatedAt: new Date().toISOString() }
      : rule,
  );
  writeStoredReminders(next);
  return next.find((rule) => rule.id === id) ?? next[0];
}

export function demoHealthSync(dto: HealthSyncRequest): HealthSyncResult {
  return {
    sourceId: `demo-${dto.sourceType}`,
    sourceType: dto.sourceType,
    received: dto.events.length,
    inserted: Math.max(dto.events.length - 1, 0),
    deduplicated: dto.events.length > 0 ? 1 : 0,
    failed: 0,
  };
}

function buildReminder(input: {
  targetType: ReminderRule['targetType'];
  title: string;
  rrule: string;
  isActive: boolean;
}): ReminderRule {
  const now = new Date().toISOString();
  return {
    id: makeId('demo-reminder'),
    userId: USER_ID,
    targetType: input.targetType,
    targetId: null,
    title: input.title,
    rrule: input.rrule,
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  };
}

function readStoredReminders(): ReminderRule[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(DEMO_REMINDERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredReminders(reminders: ReminderRule[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_REMINDERS_KEY, JSON.stringify(reminders));
}

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function buildFixture(
  date: string,
  metrics: Omit<DemoDayFixture, 'rawEvents'>,
): DemoDayFixture {
  return {
    ...metrics,
    rawEvents: buildRawEvents(date, metrics),
  };
}

function buildGeneratedFixture(date: string): DemoDayFixture {
  const seed = dateSeed(date);
  return buildFixture(date, {
    steps: 7200 + seed * 410,
    activeMinutes: 38 + (seed % 5) * 6,
    activeKcal: 320 + seed * 18,
    sleepMinutes: 390 + (seed % 5) * 18,
    deepSleepMinutes: 70 + (seed % 4) * 8,
    remSleepMinutes: 82 + (seed % 5) * 7,
    sleepScore: 72 + (seed % 6) * 3,
    kcal: 1480 + (seed % 6) * 85,
    carbsG: 185 + (seed % 5) * 9,
    proteinG: 66 + (seed % 4) * 5,
    fatG: 43 + (seed % 5) * 4,
    waterMl: 1350 + (seed % 4) * 180,
    caffeineMg: seed % 2 === 0 ? 95 : 34,
    sugarG: seed % 3 === 0 ? 22 : 8,
    intakeTaken: seed % 4 === 0 ? 2 : 3,
  });
}

function buildRawEvents(
  date: string,
  metrics: Omit<DemoDayFixture, 'rawEvents'>,
): DemoRawEvent[] {
  return [
    {
      id: `raw-${date}-activity`,
      date,
      time: '08:30',
      eventType: 'activity',
      sourceType: 'apple_health',
      title: 'Apple Health 활동 동기화',
      summary: `${metrics.steps.toLocaleString()} 걸음 · 활동 ${metrics.activeMinutes}분`,
      rawPayload: {
        health_events: {
          event_type: 'activity',
          started_at: `${date}T00:00:00+09:00`,
          ended_at: `${date}T23:59:59+09:00`,
          timezone: 'Asia/Seoul',
          confidence_score: 0.99,
        },
        activity_records: {
          steps: metrics.steps,
          active_minutes: metrics.activeMinutes,
          active_kcal: metrics.activeKcal,
        },
      },
    },
    {
      id: `raw-${date}-sleep`,
      date,
      time: '08:40',
      eventType: 'sleep',
      sourceType: 'wearable',
      title: '수면 패턴 기록',
      summary: `${Math.floor(metrics.sleepMinutes / 60)}시간 ${metrics.sleepMinutes % 60}분 · 점수 ${metrics.sleepScore}`,
      rawPayload: {
        health_events: {
          event_type: 'sleep',
          started_at: previousNight(date),
          ended_at: `${date}T07:20:00+09:00`,
          timezone: 'Asia/Seoul',
          confidence_score: 0.93,
        },
        sleep_records: {
          total_minutes: metrics.sleepMinutes,
          deep_sleep_minutes: metrics.deepSleepMinutes,
          rem_sleep_minutes: metrics.remSleepMinutes,
          sleep_score: metrics.sleepScore,
        },
      },
    },
    {
      id: `raw-${date}-meal`,
      date,
      time: '12:30',
      eventType: 'meal',
      sourceType: 'vision_ai',
      title: '식사 사진 분석',
      summary: `${metrics.kcal.toLocaleString()} kcal · 탄 ${metrics.carbsG}g 단 ${metrics.proteinG}g 지 ${metrics.fatG}g`,
      rawPayload: {
        health_events: {
          event_type: 'meal',
          started_at: `${date}T12:30:00+09:00`,
          timezone: 'Asia/Seoul',
          confidence_score: 0.86,
        },
        media_assets: [{ kind: 'meal_photo', storage_key: `demo/meals/${date}.jpg` }],
        ai_analysis_results: {
          analysis_type: 'meal_image',
          confidence: 0.86,
          estimated_kcal: metrics.kcal,
        },
      },
    },
    {
      id: `raw-${date}-beverage`,
      date,
      time: '15:00',
      eventType: 'beverage',
      sourceType: 'label_scan',
      title: '음료 라벨 스캔',
      summary: `${metrics.waterMl} ml · 카페인 ${metrics.caffeineMg}mg · 당 ${metrics.sugarG}g`,
      rawPayload: {
        health_events: {
          event_type: 'beverage',
          started_at: `${date}T15:00:00+09:00`,
          timezone: 'Asia/Seoul',
          confidence_score: 0.9,
        },
        beverage_logs: {
          volume_ml: metrics.waterMl,
          caffeine_mg: metrics.caffeineMg,
          sugar_g: metrics.sugarG,
        },
      },
    },
    {
      id: `raw-${date}-intake`,
      date,
      time: '20:00',
      eventType: 'intake',
      sourceType: 'manual',
      title: '약/영양제 복용',
      summary: `${metrics.intakeTaken}/3 복용 완료`,
      rawPayload: {
        health_events: {
          event_type: 'intake',
          started_at: `${date}T20:00:00+09:00`,
          timezone: 'Asia/Seoul',
          confidence_score: 1,
        },
        intake_logs: {
          scheduled_count: 3,
          taken_count: metrics.intakeTaken,
          skipped_count: 3 - metrics.intakeTaken,
          items: ['오메가3', '비타민D', '마그네슘'],
        },
      },
    },
    {
      id: `raw-${date}-cosmetic`,
      date,
      time: '22:10',
      eventType: 'cosmetic',
      sourceType: 'manual',
      title: '화장품 사용 기록',
      summary: '레티놀/나이아신아마이드 성분 사용',
      rawPayload: {
        health_events: {
          event_type: 'cosmetic',
          started_at: `${date}T22:10:00+09:00`,
          timezone: 'Asia/Seoul',
          confidence_score: 1,
        },
        cosmetic_usage_logs: {
          product_name: '데모 나이트 크림',
          ingredients: ['retinol', 'niacinamide'],
          skin_note: '건조감 없음',
        },
      },
    },
  ];
}

function dateSeed(date: string): number {
  const day = Number(date.split('-')[2] ?? 1);
  return Number.isFinite(day) && day > 0 ? day : 1;
}

function today(): string {
  return DEMO_TODAY;
}

function currentMonday(): string {
  return DEMO_WEEK_START;
}

function toDate(date: Date): string {
  return date.toLocaleDateString('en-CA');
}

function previousNight(date: string): string {
  const previous = new Date(`${date}T00:00:00+09:00`);
  previous.setDate(previous.getDate() - 1);
  return `${toDate(previous)}T23:40:00+09:00`;
}
