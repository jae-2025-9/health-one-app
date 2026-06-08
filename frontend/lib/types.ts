export type ReminderTargetType = 'intake' | 'hydration' | 'sleep' | 'activity' | 'custom';

export interface ReminderRule {
  id: string;
  userId: string;
  targetType: ReminderTargetType;
  targetId: string | null;
  title: string;
  rrule: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderDto {
  targetType: ReminderTargetType;
  targetId?: string | null;
  title: string;
  rrule: string;
  isActive?: boolean;
}

export interface PatchReminderDto {
  title?: string;
  rrule?: string;
  isActive?: boolean;
}

export interface DailyReport {
  date: string;
  timezone: string;
  activity: {
    totalSteps: number | null;
    totalActiveMinutes: number | null;
    totalActiveKcal: number | null;
  } | null;
  sleep: {
    totalMinutes: number | null;
    deepSleepMinutes: number | null;
    remSleepMinutes: number | null;
    sleepScore: number | null;
  } | null;
  nutrition: {
    totalKcal: number | null;
    totalCarbsG: number | null;
    totalProteinG: number | null;
    totalFatG: number | null;
    mealCount: number;
  } | null;
  hydration: {
    totalVolumeMl: number | null;
    totalCaffeineMg: number | null;
    totalSugarG: number | null;
  } | null;
  intakes: {
    scheduledCount: number;
    takenCount: number;
    skippedCount: number;
  } | null;
  reminders: {
    scheduledCount: number;
    sentCount: number;
    failedCount: number;
  } | null;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  timezone: string;
  activity: {
    totalSteps: number | null;
    avgActiveMinutes: number | null;
    totalActiveKcal: number | null;
    activeDays: number;
  } | null;
  sleep: {
    avgTotalMinutes: number | null;
    avgSleepScore: number | null;
    recordedDays: number;
  } | null;
  nutrition: {
    avgTotalKcal: number | null;
    recordedDays: number;
  } | null;
  hydration: {
    avgVolumeMl: number | null;
    avgCaffeineMg: number | null;
  } | null;
  intakes: {
    totalScheduled: number;
    totalTaken: number;
    adherenceRate: number | null;
  } | null;
}

export interface HealthSyncEvent {
  eventType: string;
  sourceType?: string;
  externalRecordId?: string;
  startedAt: string;
  endedAt?: string;
  timezone: string;
  confidenceScore?: number;
  rawPayload?: Record<string, unknown>;
}

export interface HealthSyncRequest {
  sourceType: 'apple_health' | 'samsung_health';
  externalAccountId?: string | null;
  events: HealthSyncEvent[];
}

export interface HealthSyncResult {
  sourceId: string;
  sourceType: string;
  received: number;
  inserted: number;
  deduplicated: number;
  failed: number;
}

export interface AiQuestionRequest {
  question: string;
  date?: string;
}

export interface AiQuestionResponse {
  analysisId: string;
  answer: string;
  model: string;
  safetyNotice: string;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
}
