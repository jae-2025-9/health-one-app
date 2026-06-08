'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DEMO_WEEK_START, isDemoModeEnabled } from '@/lib/demo-data';
import type { WeeklyReport } from '@/lib/types';

function Stat({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="flex flex-col">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {value ?? <span className="text-gray-300">—</span>}
        {value != null && unit && <span className="stat-unit">{unit}</span>}
      </span>
    </div>
  );
}

function SectionCard({
  icon, label, iconBg, border, isEmpty, children,
}: {
  icon: string; label: string; iconBg: string; border: string; isEmpty: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`card border-l-4 ${border}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`section-icon ${iconBg}`}>{icon}</div>
        <h2 className="font-bold text-gray-800">{label}</h2>
      </div>
      {isEmpty ? (
        <div className="empty-section">
          <span className="text-3xl opacity-20">{icon}</span>
          <p className="text-sm text-gray-400">이번 주 기록 없음</p>
        </div>
      ) : children}
    </div>
  );
}

function currentMonday() {
  const now = new Date();
  const day = now.getUTCDay();
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return mon.toISOString().split('T')[0];
}

export default function WeeklyReportPage() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [weekStart, setWeekStart] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(ws: string) {
    setLoading(true);
    setError('');
    try {
      setReport(await api.reports.weekly(ws));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const mon = isDemoModeEnabled() ? DEMO_WEEK_START : currentMonday();
    setWeekStart(mon);
    load(mon);
  }, []);

  const adherenceRate = report?.intakes?.adherenceRate ?? null;
  const adherencePct = adherenceRate !== null ? Math.round(adherenceRate * 100) : null;
  const adherenceColor =
    adherencePct === null ? 'bg-gray-200'
    : adherencePct >= 80 ? 'bg-green-500'
    : adherencePct >= 50 ? 'bg-yellow-400'
    : 'bg-red-400';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">주간 리포트</h1>
          {report && (
            <p className="text-sm text-gray-400 mt-0.5">
              {report.weekStart} ~ {report.weekEnd} · {report.timezone}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-gray-400">주 시작일 (월요일)</span>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="input w-auto text-xs"
            />
          </div>
          <button onClick={() => load(weekStart)} disabled={loading} className="btn-primary text-xs py-2 self-end">
            {loading ? '…' : '조회'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-l-4 border-l-red-400 bg-red-50">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}

      {loading && !report && (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {report && (
        <div className="space-y-3">
          <SectionCard icon="🏃" label="활동" iconBg="bg-blue-50" border="border-l-blue-400" isEmpty={!report.activity}>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="총 걸음 수" value={report.activity?.totalSteps?.toLocaleString() ?? null} />
              <Stat label="평균 활동 시간" value={report.activity?.avgActiveMinutes?.toFixed(1) ?? null} unit="분" />
              <Stat label="총 소모 칼로리" value={report.activity?.totalActiveKcal?.toFixed(0) ?? null} unit="kcal" />
              <Stat label="활동한 날" value={report.activity ? `${report.activity.activeDays}일` : null} />
            </div>
          </SectionCard>

          <SectionCard icon="😴" label="수면" iconBg="bg-indigo-50" border="border-l-indigo-400" isEmpty={!report.sleep}>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="평균 수면" value={report.sleep?.avgTotalMinutes?.toFixed(0) ?? null} unit="분" />
              <Stat label="평균 수면점수" value={report.sleep?.avgSleepScore?.toFixed(1) ?? null} />
              <Stat label="기록한 날" value={report.sleep ? `${report.sleep.recordedDays}일` : null} />
            </div>
          </SectionCard>

          <SectionCard icon="🥗" label="영양" iconBg="bg-orange-50" border="border-l-orange-400" isEmpty={!report.nutrition}>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="평균 칼로리" value={report.nutrition?.avgTotalKcal?.toFixed(0) ?? null} unit="kcal" />
              <Stat label="기록한 날" value={report.nutrition ? `${report.nutrition.recordedDays}일` : null} />
            </div>
          </SectionCard>

          <SectionCard icon="💧" label="수분" iconBg="bg-cyan-50" border="border-l-cyan-400" isEmpty={!report.hydration}>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="평균 섭취량" value={report.hydration?.avgVolumeMl?.toFixed(0) ?? null} unit="ml" />
              <Stat label="평균 카페인" value={report.hydration?.avgCaffeineMg?.toFixed(0) ?? null} unit="mg" />
            </div>
          </SectionCard>

          <SectionCard icon="💊" label="복약" iconBg="bg-purple-50" border="border-l-purple-400" isEmpty={!report.intakes}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Stat label="총 예정" value={report.intakes?.totalScheduled ?? null} />
              <Stat label="총 완료" value={report.intakes?.totalTaken ?? null} />
              <div className="flex flex-col">
                <span className="stat-label">준수율</span>
                <span className={`text-2xl font-bold leading-none ${
                  adherencePct === null ? 'text-gray-300'
                  : adherencePct >= 80 ? 'text-green-600'
                  : adherencePct >= 50 ? 'text-yellow-500'
                  : 'text-red-500'
                }`}>
                  {adherencePct !== null ? `${adherencePct}%` : '—'}
                </span>
              </div>
            </div>
            <div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${adherenceColor}`}
                  style={{ width: adherencePct !== null ? `${adherencePct}%` : '0%' }}
                />
              </div>
              {adherencePct === null && (
                <p className="text-xs text-gray-400 mt-1">기록 없음</p>
              )}
            </div>
          </SectionCard>

          <p className="text-center text-xs text-gray-300 pt-1">
            건강 관리 참고용이며 의학적 진단이 아닙니다
          </p>
        </div>
      )}
    </div>
  );
}
