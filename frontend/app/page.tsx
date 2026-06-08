'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DEMO_TODAY, isDemoModeEnabled } from '@/lib/demo-data';
import type { DailyReport } from '@/lib/types';

const SECTIONS = [
  {
    key: 'activity' as const,
    icon: '🏃', label: '활동',
    iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
    border: 'border-l-blue-400',
  },
  {
    key: 'sleep' as const,
    icon: '😴', label: '수면',
    iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500',
    border: 'border-l-indigo-400',
  },
  {
    key: 'nutrition' as const,
    icon: '🥗', label: '영양',
    iconBg: 'bg-orange-50', iconColor: 'text-orange-500',
    border: 'border-l-orange-400',
  },
  {
    key: 'hydration' as const,
    icon: '💧', label: '수분',
    iconBg: 'bg-cyan-50', iconColor: 'text-cyan-500',
    border: 'border-l-cyan-400',
  },
  {
    key: 'intakes' as const,
    icon: '💊', label: '복약',
    iconBg: 'bg-purple-50', iconColor: 'text-purple-500',
    border: 'border-l-purple-400',
  },
  {
    key: 'reminders' as const,
    icon: '🔔', label: '알림',
    iconBg: 'bg-green-50', iconColor: 'text-green-500',
    border: 'border-l-green-400',
  },
];

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
        <h2 className="font-bold text-gray-800 text-base">{label}</h2>
      </div>
      {isEmpty ? (
        <div className="empty-section">
          <span className="text-3xl opacity-20">{icon}</span>
          <p className="text-sm text-gray-400">오늘 기록 없음</p>
        </div>
      ) : children}
    </div>
  );
}

export default function HomePage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(d: string) {
    setLoading(true);
    setError('');
    try {
      setReport(await api.reports.daily(d));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const today = isDemoModeEnabled() ? DEMO_TODAY : new Date().toLocaleDateString('en-CA');
    setDate(today);
    load(today);
  }, []);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">오늘의 건강</h1>
          {report && <p className="text-sm text-gray-400 mt-0.5">{report.date} · {report.timezone}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto text-xs"
          />
          <button onClick={() => load(date)} disabled={loading} className="btn-primary text-xs py-2">
            {loading ? '…' : '조회'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-l-4 border-l-red-400 bg-red-50">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}

      {report && (
        <div className="space-y-3">
          {/* 활동 */}
          <SectionCard {...SECTIONS[0]} isEmpty={!report.activity}>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="걸음" value={report.activity?.totalSteps?.toLocaleString() ?? null} />
              <Stat label="활동" value={report.activity?.totalActiveMinutes ?? null} unit="분" />
              <Stat label="소모" value={report.activity?.totalActiveKcal?.toFixed(0) ?? null} unit="kcal" />
            </div>
          </SectionCard>

          {/* 수면 */}
          <SectionCard {...SECTIONS[1]} isEmpty={!report.sleep}>
            <div className="grid grid-cols-4 gap-4">
              <Stat label="수면" value={report.sleep?.totalMinutes ?? null} unit="분" />
              <Stat label="깊은수면" value={report.sleep?.deepSleepMinutes ?? null} unit="분" />
              <Stat label="REM" value={report.sleep?.remSleepMinutes ?? null} unit="분" />
              <Stat label="수면점수" value={report.sleep?.sleepScore?.toFixed(1) ?? null} />
            </div>
          </SectionCard>

          {/* 영양 */}
          <SectionCard {...SECTIONS[2]} isEmpty={!report.nutrition}>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="칼로리" value={report.nutrition?.totalKcal?.toFixed(0) ?? null} unit="kcal" />
              <Stat label="탄수화물" value={report.nutrition?.totalCarbsG?.toFixed(1) ?? null} unit="g" />
              <Stat label="단백질" value={report.nutrition?.totalProteinG?.toFixed(1) ?? null} unit="g" />
              <Stat label="지방" value={report.nutrition?.totalFatG?.toFixed(1) ?? null} unit="g" />
              <Stat label="식사" value={report.nutrition?.mealCount ?? null} unit="회" />
            </div>
          </SectionCard>

          {/* 수분 */}
          <SectionCard {...SECTIONS[3]} isEmpty={!report.hydration}>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="수분" value={report.hydration?.totalVolumeMl?.toFixed(0) ?? null} unit="ml" />
              <Stat label="카페인" value={report.hydration?.totalCaffeineMg?.toFixed(0) ?? null} unit="mg" />
              <Stat label="당분" value={report.hydration?.totalSugarG?.toFixed(1) ?? null} unit="g" />
            </div>
          </SectionCard>

          {/* 복약 */}
          <SectionCard {...SECTIONS[4]} isEmpty={!report.intakes}>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="예정" value={report.intakes?.scheduledCount ?? null} />
              <Stat label="완료" value={report.intakes?.takenCount ?? null} />
              <Stat label="건너뜀" value={report.intakes?.skippedCount ?? null} />
            </div>
            {report.intakes && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>복약 완료율</span>
                  <span className="font-semibold text-gray-600">
                    {report.intakes.scheduledCount > 0
                      ? `${Math.round((report.intakes.takenCount / report.intakes.scheduledCount) * 100)}%`
                      : '—'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{
                      width: report.intakes.scheduledCount > 0
                        ? `${(report.intakes.takenCount / report.intakes.scheduledCount) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            )}
          </SectionCard>

          {/* 알림 */}
          <SectionCard {...SECTIONS[5]} isEmpty={!report.reminders}>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="예정" value={report.reminders?.scheduledCount ?? null} />
              <Stat label="전송" value={report.reminders?.sentCount ?? null} />
              <Stat label="실패" value={report.reminders?.failedCount ?? null} />
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
