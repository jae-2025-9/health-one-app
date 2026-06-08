'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { ReminderTargetType } from '@/lib/types';

const TARGET_OPTIONS = [
  { value: 'intake'    as ReminderTargetType, label: '💊 복약'  },
  { value: 'hydration' as ReminderTargetType, label: '💧 수분'  },
  { value: 'sleep'     as ReminderTargetType, label: '😴 수면'  },
  { value: 'activity'  as ReminderTargetType, label: '🏃 활동'  },
  { value: 'custom'    as ReminderTargetType, label: '✏️ 기타'  },
];

const RRULE_PRESETS = [
  { label: '매일 오전 8시',       value: 'RRULE:FREQ=DAILY;BYHOUR=8;BYMINUTE=0'   },
  { label: '매일 오후 9시',       value: 'RRULE:FREQ=DAILY;BYHOUR=21;BYMINUTE=0'  },
  { label: '2시간마다 (9-19시)',  value: 'RRULE:FREQ=HOURLY;INTERVAL=2;BYHOUR=9,11,13,15,17,19' },
  { label: '매주 월요일 오전 8시', value: 'RRULE:FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=0' },
];

export default function NewReminderPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    targetType: 'intake' as ReminderTargetType,
    title: '',
    rrule: RRULE_PRESETS[0].value,
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
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">알림 추가</h1>
        <p className="text-sm text-gray-400 mt-0.5">반복 알림 규칙을 만들어요</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* 유형 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">알림 유형</label>
          <div className="grid grid-cols-5 gap-2">
            {TARGET_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setForm({ ...form, targetType: o.value })}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all text-center
                  ${form.targetType === o.value
                    ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="예: 아침 비타민 복용"
            maxLength={100}
            className="input"
          />
        </div>

        {/* RRULE */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">반복 시간</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {RRULE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm({ ...form, rrule: p.value })}
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all
                  ${form.rrule === p.value
                    ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={form.rrule}
            onChange={(e) => setForm({ ...form, rrule: e.target.value })}
            className="input font-mono text-xs"
          />
        </div>

        {/* 활성화 토글 */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-semibold text-gray-700">즉시 활성화</p>
            <p className="text-xs text-gray-400">저장 즉시 알림이 시작돼요</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, isActive: !form.isActive })}
            className={`toggle ${form.isActive ? 'bg-green-500' : 'bg-gray-200'}`}
          >
            <span className={`toggle-thumb ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? '저장중…' : '저장하기'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
