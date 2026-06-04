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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  return body.data as T;
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
