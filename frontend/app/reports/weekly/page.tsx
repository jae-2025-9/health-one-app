'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { WeeklyReport } from '@/lib/types';

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value ?? '-'}</p>
    </div>
  );
}

function Section({ title, children, isEmpty }: { title: string; children: React.ReactNode; isEmpty: boolean }) {
  return (
    <div className="card">
      <h2 className="font-semibold text-gray-700 mb-3">{title}</h2>
      {isEmpty ? <p className="empty-state">이번 주 기록 없음</p> : children}
    </div>
  );
}

function currentMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + diff);
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
      const data = await api.reports.weekly(ws);
      setReport(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const mon = currentMonday();
    setWeekStart(mon);
    load(mon);
  }, []);

  function adherenceDisplay(rate: number | null): string {
    if (rate === null) return '기록 없음';
    return `${(rate * 100).toFixed(1)}%`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">주간 리포트</h1>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <label className="text-xs text-gray-500 mb-0.5">주 시작일 (월요일)</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="input w-auto"
            />
          </div>
          <button onClick={() => load(weekStart)} disabled={loading} className="btn-primary self-end">
            {loading ? '로딩중…' : '조회'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {report && (
        <>
          <p className="text-sm text-gray-500">
            {report.weekStart} ~ {report.weekEnd} · {report.timezone}
          </p>

          <Section title="🏃 활동" isEmpty={!report.activity}>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="총 걸음 수" value={report.activity?.totalSteps?.toLocaleString() ?? null} />
              <StatCard label="평균 활동 시간(분)" value={report.activity?.avgActiveMinutes?.toFixed(1) ?? null} />
              <StatCard label="총 소모 칼로리" value={report.activity?.totalActiveKcal?.toFixed(1) ?? null} />
              <StatCard label="활동한 날" value={report.activity ? `${report.activity.activeDays}일` : null} />
            </div>
          </Section>

          <Section title="😴 수면" isEmpty={!report.sleep}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="평균 수면(분)" value={report.sleep?.avgTotalMinutes?.toFixed(0) ?? null} />
              <StatCard label="평균 수면 점수" value={report.sleep?.avgSleepScore?.toFixed(1) ?? null} />
              <StatCard label="기록한 날" value={report.sleep ? `${report.sleep.recordedDays}일` : null} />
            </div>
          </Section>

          <Section title="🥗 영양" isEmpty={!report.nutrition}>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="평균 칼로리(kcal)" value={report.nutrition?.avgTotalKcal?.toFixed(0) ?? null} />
              <StatCard label="기록한 날" value={report.nutrition ? `${report.nutrition.recordedDays}일` : null} />
            </div>
          </Section>

          <Section title="💧 수분" isEmpty={!report.hydration}>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="평균 섭취량(ml)" value={report.hydration?.avgVolumeMl?.toFixed(0) ?? null} />
              <StatCard label="평균 카페인(mg)" value={report.hydration?.avgCaffeineMg?.toFixed(1) ?? null} />
            </div>
          </Section>

          <Section title="💊 복약" isEmpty={!report.intakes}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="총 예정" value={report.intakes?.totalScheduled ?? null} />
              <StatCard label="총 복용 완료" value={report.intakes?.totalTaken ?? null} />
              <div>
                <p className="stat-label">복약 준수율</p>
                <p className={`text-lg font-semibold ${
                  report.intakes?.adherenceRate === null
                    ? 'text-gray-400'
                    : report.intakes!.adherenceRate >= 0.8
                    ? 'text-green-600'
                    : 'text-orange-500'
                }`}>
                  {adherenceDisplay(report.intakes?.adherenceRate ?? null)}
                </p>
              </div>
            </div>
          </Section>

          <p className="text-xs text-gray-400 text-center pt-2">
            이 리포트는 건강 관리 참고용이며 진단이 아닙니다.
          </p>
        </>
      )}
    </div>
  );
}
