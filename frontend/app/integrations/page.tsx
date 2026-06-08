'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { HealthSyncResult } from '@/lib/types';

const EXAMPLE_EVENTS = JSON.stringify([
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

export default function IntegrationsPage() {
  const [sourceType, setSourceType] = useState<'apple_health' | 'samsung_health'>('apple_health');
  const [externalAccountId, setExternalAccountId] = useState('');
  const [eventsJson, setEventsJson] = useState(EXAMPLE_EVENTS);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<HealthSyncResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);

    let events;
    try {
      events = JSON.parse(eventsJson);
    } catch {
      setError('events JSON 형식이 잘못됐습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.integrations.healthSync({
        sourceType,
        externalAccountId: externalAccountId.trim() || null,
        events,
      });
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-gray-900">건강 앱 연동</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">소스 유형</label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as 'apple_health' | 'samsung_health')}
            className="select"
          >
            <option value="apple_health">Apple Health</option>
            <option value="samsung_health">Samsung Health</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            외부 계정 ID <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <input
            type="text"
            value={externalAccountId}
            onChange={(e) => setExternalAccountId(e.target.value)}
            placeholder="user-apple-id-abc123"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이벤트 배열 (JSON)</label>
          <textarea
            value={eventsJson}
            onChange={(e) => setEventsJson(e.target.value)}
            rows={10}
            className="input font-mono text-xs resize-y"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? '동기화 중…' : '동기화 요청'}
        </button>
      </form>

      {result && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">동기화 결과</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">수신</p>
              <p className="text-2xl font-bold text-gray-900">{result.received}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">신규 저장</p>
              <p className="text-2xl font-bold text-green-700">{result.inserted}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">중복 건너뜀</p>
              <p className="text-2xl font-bold text-blue-700">{result.deduplicated}</p>
            </div>
            <div className={`rounded-lg p-3 ${result.failed > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-500 mb-1">실패</p>
              <p className={`text-2xl font-bold ${result.failed > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {result.failed}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400">소스 ID: {result.sourceId}</p>
        </div>
      )}
    </div>
  );
}
