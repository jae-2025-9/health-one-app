'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DailyReport } from '@/lib/types';

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
      {isEmpty ? <p className="empty-state">오늘 기록 없음</p> : children}
    </div>
  );
}

export default function HomePage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function todayStr() {
    return new Date().toLocaleDateString('en-CA');
  }

  async function load(d?: string) {
    setLoading(true);
    setError('');
    try {
      const data = await api.reports.daily(d);
      setReport(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const today = todayStr();
    setDate(today);
    load(today);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">홈 대시보드</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto"
          />
          <button onClick={() => load(date)} disabled={loading} className="btn-primary">
            {loading ? '로딩중…' : '조회'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {report && (
        <>
          <p className="text-sm text-gray-500">{report.date} · {report.timezone}</p>

          <Section title="🏃 활동" isEmpty={!report.activity}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="걸음 수" value={report.activity?.totalSteps?.toLocaleString() ?? null} />
              <StatCard label="활동 시간(분)" value={report.activity?.totalActiveMinutes ?? null} />
              <StatCard label="소모 칼로리" value={report.activity?.totalActiveKcal?.toFixed(1) ?? null} />
            </div>
          </Section>

          <Section title="😴 수면" isEmpty={!report.sleep}>
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="총 수면(분)" value={report.sleep?.totalMinutes ?? null} />
              <StatCard label="깊은 수면(분)" value={report.sleep?.deepSleepMinutes ?? null} />
              <StatCard label="REM(분)" value={report.sleep?.remSleepMinutes ?? null} />
              <StatCard label="수면 점수" value={report.sleep?.sleepScore?.toFixed(1) ?? null} />
            </div>
          </Section>

          <Section title="🥗 영양" isEmpty={!report.nutrition}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="칼로리(kcal)" value={report.nutrition?.totalKcal?.toFixed(0) ?? null} />
              <StatCard label="탄수화물(g)" value={report.nutrition?.totalCarbsG?.toFixed(1) ?? null} />
              <StatCard label="단백질(g)" value={report.nutrition?.totalProteinG?.toFixed(1) ?? null} />
              <StatCard label="지방(g)" value={report.nutrition?.totalFatG?.toFixed(1) ?? null} />
              <StatCard label="식사 횟수" value={report.nutrition?.mealCount ?? null} />
            </div>
          </Section>

          <Section title="💧 수분" isEmpty={!report.hydration}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="섭취량(ml)" value={report.hydration?.totalVolumeMl?.toFixed(0) ?? null} />
              <StatCard label="카페인(mg)" value={report.hydration?.totalCaffeineMg?.toFixed(1) ?? null} />
              <StatCard label="당분(g)" value={report.hydration?.totalSugarG?.toFixed(1) ?? null} />
            </div>
          </Section>

          <Section title="💊 복약" isEmpty={!report.intakes}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="예정" value={report.intakes?.scheduledCount ?? null} />
              <StatCard label="복용 완료" value={report.intakes?.takenCount ?? null} />
              <StatCard label="건너뜀" value={report.intakes?.skippedCount ?? null} />
            </div>
          </Section>

          <Section title="🔔 알림" isEmpty={!report.reminders}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="예정" value={report.reminders?.scheduledCount ?? null} />
              <StatCard label="전송 완료" value={report.reminders?.sentCount ?? null} />
              <StatCard label="실패" value={report.reminders?.failedCount ?? null} />
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
