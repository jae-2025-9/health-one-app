import type {
  CreateReminderDto,
  DailyReport,
  HealthSyncRequest,
  HealthSyncResult,
  PatchReminderDto,
  ReminderRule,
  WeeklyReport,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';
const API_TIMEOUT_MS = 12_000;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)
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

export const api = {
  reminders: {
    list: () => apiFetch<ReminderRule[]>('/reminders'),
    create: (dto: CreateReminderDto) =>
      apiFetch<ReminderRule>('/reminders', { method: 'POST', body: JSON.stringify(dto) }),
    patch: (id: string, dto: PatchReminderDto) =>
      apiFetch<ReminderRule>(`/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  },
  reports: {
    daily: (date?: string) =>
      apiFetch<DailyReport>(`/reports/daily${date ? `?date=${date}` : ''}`),
    weekly: (weekStart?: string) =>
      apiFetch<WeeklyReport>(`/reports/weekly${weekStart ? `?weekStart=${weekStart}` : ''}`),
  },
  integrations: {
    healthSync: (dto: HealthSyncRequest) =>
      apiFetch<HealthSyncResult>('/integrations/health-sync', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },
};
