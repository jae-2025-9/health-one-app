import type {
  AiQuestionRequest,
  AiQuestionResponse,
  CreateReminderDto,
  DailyReport,
  HealthSyncRequest,
  HealthSyncResult,
  PatchReminderDto,
  ReminderRule,
  WeeklyReport,
} from './types';

const DEMO_MODE_KEY = 'health-one-demo-mode';
const DEMO_REMINDERS_KEY = 'health-one-demo-reminders';
const USER_ID = '00000000-0000-0000-0000-000000000001';
const SAFETY_NOTICE =
  'AI 답변은 건강 관리 참고 정보이며 의료 진단이나 처방이 아닙니다. 증상이 있거나 약 복용 판단이 필요하면 전문가와 상담하세요.';

export function isDemoModeEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  const params = new URLSearchParams(window.location.search);
  const flag = params.get('demo');
  if (flag === '1') {
    window.localStorage.setItem(DEMO_MODE_KEY, '1');
    return true;
  }
  if (flag === '0') {
    window.localStorage.removeItem(DEMO_MODE_KEY);
    return false;
  }

  return window.localStorage.getItem(DEMO_MODE_KEY) === '1';
}

export function demoDailyReport(date = today()): DailyReport {
  const seed = dateSeed(date);
  const steps = 7200 + seed * 410;
  const sleepMinutes = 390 + (seed % 5) * 18;
  const waterMl = 1350 + (seed % 4) * 180;

  return {
    date,
    timezone: 'Asia/Seoul',
    activity: {
      totalSteps: steps,
      totalActiveMinutes: 38 + (seed % 5) * 6,
      totalActiveKcal: 320 + seed * 18,
    },
    sleep: {
      totalMinutes: sleepMinutes,
      deepSleepMinutes: 70 + (seed % 4) * 8,
      remSleepMinutes: 82 + (seed % 5) * 7,
      sleepScore: 72 + (seed % 6) * 3,
    },
    nutrition: {
      totalKcal: 1480 + (seed % 6) * 85,
      totalCarbsG: 185 + (seed % 5) * 9,
      totalProteinG: 66 + (seed % 4) * 5,
      totalFatG: 43 + (seed % 5) * 4,
      mealCount: 3,
    },
    hydration: {
      totalVolumeMl: waterMl,
      totalCaffeineMg: seed % 2 === 0 ? 95 : 34,
      totalSugarG: seed % 3 === 0 ? 22 : 8,
    },
    intakes: {
      scheduledCount: 3,
      takenCount: seed % 4 === 0 ? 2 : 3,
      skippedCount: seed % 4 === 0 ? 1 : 0,
    },
    reminders: {
      scheduledCount: 4,
      sentCount: 3,
      failedCount: 0,
    },
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

export function demoAiQuestion(dto: AiQuestionRequest): AiQuestionResponse {
  const question = dto.question.toLowerCase();
  const answer = buildDemoAnswer(question);
  return {
    analysisId: makeId('demo-analysis'),
    answer,
    model: 'solar-pro3-demo-fallback',
    safetyNotice: SAFETY_NOTICE,
    usage: {
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
    },
  };
}

function buildDemoAnswer(question: string): string {
  if (
    question.includes('이부프로펜') ||
    question.includes('오메가') ||
    question.includes('영양제') ||
    question.includes('약/')
  ) {
    return [
      '오메가3와 이부프로펜은 둘 다 출혈 위험과 관련해 주의가 필요한 조합으로 볼 수 있습니다.',
      '단기간 복용이라도 위장 불편, 멍, 코피, 혈변 같은 신호가 있으면 중단하고 상담하는 편이 안전합니다.',
      '시연 기준 안내로는 같은 시간에 몰아먹기보다 식후로 분리하고, 항응고제나 수술 예정이 있으면 전문가 확인을 권장합니다.',
    ].join('\n');
  }

  if (
    question.includes('레티놀') ||
    question.includes('나이아신') ||
    question.includes('살리실') ||
    question.includes('화장품')
  ) {
    return [
      '나이아신아마이드는 비교적 순한 편이지만, 레티놀이나 살리실산과 함께 쓰면 건조감과 따가움이 늘 수 있습니다.',
      '처음에는 격일 저녁 사용, 보습제 병행, 낮 시간 자외선 차단을 기본 규칙으로 잡는 것이 좋습니다.',
      '붉어짐이 오래가거나 화끈거림이 심하면 사용 빈도를 줄이고 피부과 상담을 권장합니다.',
    ].join('\n');
  }

  return [
    '오늘 기록 기준으로는 수면 시간, 수분 섭취, 복약 알림을 같이 보는 흐름이 핵심입니다.',
    '걸음 수가 목표에 가까워도 카페인과 수면 시간이 흔들리면 컨디션이 떨어질 수 있으니 오후 카페인을 줄여보세요.',
    '건강 one app은 활동, 식사, 음용, 복약, 화장품 사용을 health_events 흐름으로 묶어 하루 리포트에 합칩니다.',
  ].join('\n');
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

function dateSeed(date: string): number {
  const day = Number(date.split('-')[2] ?? 1);
  return Number.isFinite(day) && day > 0 ? day : 1;
}

function today(): string {
  return new Date().toLocaleDateString('en-CA');
}

function currentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return toDate(monday);
}

function toDate(date: Date): string {
  return date.toLocaleDateString('en-CA');
}
