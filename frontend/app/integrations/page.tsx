'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { HealthSyncResult } from '@/lib/types';

const DEMO_SYNC_EVENTS = [
  {
    eventType: 'activity',
    startedAt: '2026-06-06T00:00:00+09:00',
    endedAt: '2026-06-06T23:59:59+09:00',
    timezone: 'Asia/Seoul',
    confidenceScore: 1.0,
  },
  {
    eventType: 'sleep',
    startedAt: '2026-06-05T23:40:00+09:00',
    endedAt: '2026-06-06T07:20:00+09:00',
    timezone: 'Asia/Seoul',
    confidenceScore: 0.93,
  },
] as const;

const SYNC_PREVIEW = [
  { label: '활동 데이터', value: '걸음 수와 활동 시간' },
  { label: '수면 데이터', value: '수면 시간과 수면 품질' },
];

const RESULT_CARDS = [
  { key: 'received'     as const, label: '수신',       bg: 'bg-gray-50',    value: (n: number) => n,           color: 'text-gray-800' },
  { key: 'inserted'     as const, label: '신규 저장', bg: 'bg-green-50',   value: (n: number) => n,           color: 'text-green-700' },
  { key: 'deduplicated' as const, label: '중복 건너뜀', bg: 'bg-blue-50', value: (n: number) => n,           color: 'text-blue-700' },
  { key: 'failed'       as const, label: '실패',       bg: (n: number) => n > 0 ? 'bg-red-50' : 'bg-gray-50', value: (n: number) => n, color: (n: number) => n > 0 ? 'text-red-600' : 'text-gray-300' },
];

export default function IntegrationsPage() {
  const [sourceType, setSourceType] = useState<'apple_health' | 'samsung_health'>('apple_health');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<HealthSyncResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);

    setSubmitting(true);
    try {
      setResult(await api.integrations.healthSync({
        sourceType,
        externalAccountId: null,
        events: DEMO_SYNC_EVENTS.map((event) => ({
          ...event,
          sourceType,
        })),
      }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">건강 앱 연동</h1>
        <p className="text-sm text-gray-400 mt-0.5">Apple Health / Samsung Health 데이터를 동기화해요</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* 소스 유형 */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">플랫폼</label>
          <div className="grid grid-cols-2 gap-2">
            {(['apple_health', 'samsung_health'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSourceType(v)}
                className={`py-3 rounded-xl text-sm font-semibold border transition-all
                  ${sourceType === v
                    ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
              >
                {v === 'apple_health' ? '🍎 Apple Health' : '🌐 Samsung Health'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">동기화할 시연 데이터</label>
          <div className="grid grid-cols-2 gap-2">
            {SYNC_PREVIEW.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">⚠️ {error}</p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              동기화 중…
            </span>
          ) : '동기화 요청'}
        </button>
      </form>

      {result && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✓</span>
            <h2 className="font-bold text-gray-800">동기화 완료</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {RESULT_CARDS.map(({ key, label, bg, color }) => {
              const val = result[key];
              const bgClass = typeof bg === 'function' ? bg(val) : bg;
              const colorClass = typeof color === 'function' ? color(val) : color;
              return (
                <div key={key} className={`${bgClass} rounded-xl p-4`}>
                  <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${colorClass}`}>{val}</p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">선택한 플랫폼의 건강 데이터가 백엔드로 전달되었습니다.</p>
        </div>
      )}
    </div>
  );
}
