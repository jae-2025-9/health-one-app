'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { HealthSyncResult } from '@/lib/types';

const EXAMPLE = JSON.stringify([
  {
    eventType: 'activity',
    sourceType: 'apple_health',
    externalRecordId: 'AH-STEP-2026-06-06-001',
    startedAt: '2026-06-06T00:00:00+09:00',
    endedAt: '2026-06-06T23:59:59+09:00',
    timezone: 'Asia/Seoul',
    confidenceScore: 1.0,
  },
  {
    eventType: 'sleep',
    sourceType: 'samsung_health',
    externalRecordId: 'SH-SLEEP-2026-06-06-001',
    startedAt: '2026-06-05T23:40:00+09:00',
    endedAt: '2026-06-06T07:20:00+09:00',
    timezone: 'Asia/Seoul',
    confidenceScore: 0.93,
  },
], null, 2);

const RESULT_CARDS = [
  { key: 'received'     as const, label: '수신',       bg: 'bg-gray-50',    value: (n: number) => n,           color: 'text-gray-800' },
  { key: 'inserted'     as const, label: '신규 저장', bg: 'bg-green-50',   value: (n: number) => n,           color: 'text-green-700' },
  { key: 'deduplicated' as const, label: '중복 건너뜀', bg: 'bg-blue-50', value: (n: number) => n,           color: 'text-blue-700' },
  { key: 'failed'       as const, label: '실패',       bg: (n: number) => n > 0 ? 'bg-red-50' : 'bg-gray-50', value: (n: number) => n, color: (n: number) => n > 0 ? 'text-red-600' : 'text-gray-300' },
];

export default function IntegrationsPage() {
  const [sourceType, setSourceType] = useState<'apple_health' | 'samsung_health'>('apple_health');
  const [externalAccountId, setExternalAccountId] = useState('');
  const [eventsJson, setEventsJson] = useState(EXAMPLE);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<HealthSyncResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    let events;
    try { events = JSON.parse(eventsJson); }
    catch { setError('events JSON 형식이 잘못됐어요.'); return; }

    setSubmitting(true);
    try {
      setResult(await api.integrations.healthSync({
        sourceType,
        externalAccountId: externalAccountId.trim() || null,
        events,
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

        {/* 외부 계정 ID */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            외부 계정 ID <span className="text-gray-400 font-normal text-xs">(선택)</span>
          </label>
          <input
            type="text"
            value={externalAccountId}
            onChange={(e) => setExternalAccountId(e.target.value)}
            placeholder="user-apple-id-abc123"
            className="input"
          />
        </div>

        {/* 이벤트 JSON */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">이벤트 배열 (JSON)</label>
          <textarea
            value={eventsJson}
            onChange={(e) => setEventsJson(e.target.value)}
            rows={10}
            className="input font-mono text-xs resize-y"
          />
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
          <p className="text-xs text-gray-400 font-mono break-all">소스: {result.sourceId}</p>
        </div>
      )}
    </div>
  );
}
