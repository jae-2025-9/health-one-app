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
import {
  demoAiQuestion,
  demoCreateReminder,
  demoDailyReport,
  demoHealthSync,
  demoPatchReminder,
  demoReminderList,
  demoWeeklyReport,
  isDemoModeEnabled,
} from './demo-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';
const API_TIMEOUT_MS = 12_000;
const AI_API_TIMEOUT_MS = 20_000;

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = API_TIMEOUT_MS,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      signal: init?.signal ?? controller?.signal,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
    return body.data as T;
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

async function apiFetchWithFallback<T>(
  path: string,
  fallback: () => T,
  init?: RequestInit,
  timeoutMs = API_TIMEOUT_MS,
): Promise<T> {
  if (isDemoModeEnabled()) return fallback();

  try {
    return await apiFetch<T>(path, init, timeoutMs);
  } catch {
    return fallback();
  }
}

export const api = {
  reminders: {
    list: () =>
      apiFetchWithFallback<ReminderRule[]>('/reminders', demoReminderList),
    create: (dto: CreateReminderDto) =>
      apiFetchWithFallback<ReminderRule>(
        '/reminders',
        () => demoCreateReminder(dto),
        { method: 'POST', body: JSON.stringify(dto) },
      ),
    patch: (id: string, dto: PatchReminderDto) =>
      apiFetchWithFallback<ReminderRule>(
        `/reminders/${id}`,
        () => demoPatchReminder(id, dto),
        { method: 'PATCH', body: JSON.stringify(dto) },
      ),
  },
  reports: {
    daily: (date?: string) =>
      apiFetchWithFallback<DailyReport>(
        `/reports/daily${date ? `?date=${date}` : ''}`,
        () => demoDailyReport(date),
      ),
    weekly: (weekStart?: string) =>
      apiFetchWithFallback<WeeklyReport>(
        `/reports/weekly${weekStart ? `?weekStart=${weekStart}` : ''}`,
        () => demoWeeklyReport(weekStart),
      ),
  },
  integrations: {
    healthSync: (dto: HealthSyncRequest) =>
      apiFetchWithFallback<HealthSyncResult>(
        '/integrations/health-sync',
        () => demoHealthSync(dto),
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
      ),
  },
  ai: {
    ask: (dto: AiQuestionRequest) =>
      apiFetchWithFallback<AiQuestionResponse>(
        '/ai/questions',
        () => demoAiQuestion(dto),
        {
          method: 'POST',
          body: JSON.stringify(dto),
        },
        AI_API_TIMEOUT_MS,
      ),
  },
};
