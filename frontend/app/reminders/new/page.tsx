'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { ReminderTargetType } from '@/lib/types';

const TARGET_OPTIONS: { value: ReminderTargetType; label: string }[] = [
  { value: 'intake', label: '복약' },
  { value: 'hydration', label: '수분' },
  { value: 'sleep', label: '수면' },
  { value: 'activity', label: '활동' },
  { value: 'custom', label: '기타' },
];

const RRULE_PRESETS = [
  { label: '매일 오전 8시', value: 'RRULE:FREQ=DAILY;BYHOUR=8;BYMINUTE=0' },
  { label: '매일 오후 9시', value: 'RRULE:FREQ=DAILY;BYHOUR=21;BYMINUTE=0' },
  { label: '2시간마다 (9–19시)', value: 'RRULE:FREQ=HOURLY;INTERVAL=2;BYHOUR=9,11,13,15,17,19' },
  { label: '매주 월요일 오전 8시', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=0' },
];

export default function NewReminderPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    targetType: 'intake' as ReminderTargetType,
    title: '',
    rrule: 'RRULE:FREQ=DAILY;BYHOUR=8;BYMINUTE=0',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (!form.rrule.startsWith('RRULE:')) { setError('RRULE:로 시작해야 합니다.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await api.reminders.create(form);
      router.push('/reminders');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-gray-900">알림 추가</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">알림 유형</label>
          <select
            value={form.targetType}
            onChange={(e) => setForm({ ...form, targetType: e.target.value as ReminderTargetType })}
            className="select"
          >
            {TARGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="예: 아침 비타민 복용"
            maxLength={100}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">반복 규칙 (RRULE)</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {RRULE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm({ ...form, rrule: p.value })}
                className={`text-xs px-2 py-1 rounded border transition-colors
                  ${form.rrule === p.value
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={form.rrule}
            onChange={(e) => setForm({ ...form, rrule: e.target.value })}
            placeholder="RRULE:FREQ=DAILY;BYHOUR=8;BYMINUTE=0"
            className="input font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">즉시 활성화</label>
          <button
            type="button"
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors cursor-pointer
              ${form.isActive ? 'bg-green-500' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform
              ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? '저장중…' : '저장'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
