'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DEMO_TODAY, isDemoModeEnabled } from '@/lib/demo-data';
import type { DailyReport } from '@/lib/types';

const SECTIONS = [
  { key: 'activity'  as const, icon: '🏃', label: '활동'  },
  { key: 'sleep'     as const, icon: '😴', label: '수면'  },
  { key: 'nutrition' as const, icon: '🥗', label: '영양'  },
  { key: 'hydration' as const, icon: '💧', label: '수분'  },
  { key: 'intakes'   as const, icon: '💊', label: '복약'  },
  { key: 'reminders' as const, icon: '🔔', label: '알림'  },
];

function Stat({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">
        {value ?? <span className="text-[#ccc]">—</span>}
        {value != null && unit && <span className="stat-unit">{unit}</span>}
      </p>
    </div>
  );
}

function SectionCard({ icon, label, isEmpty, children }: {
  icon: string; label: string; isEmpty: boolean; children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[15px]">{icon}</span>
        <h2 className="section-title">{label}</h2>
      </div>
      {isEmpty ? (
        <div className="empty-section">
          <p className="text-[12px] text-[#aaa]">기록 없음</p>
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold text-[#111]">오늘의 건강</h1>
          {report && <p className="text-[12px] text-[#888] mt-0.5">{report.date} · {report.timezone}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto text-xs" />
          <button onClick={() => load(date)} disabled={loading} className="btn-primary text-xs py-1.5 px-3">
            {loading ? '…' : '조회'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card bg-[#fff5f5] border-[#fecaca]">
          <p className="text-[13px] text-red-600">⚠️ {error}</p>
        </div>
      )}

      {report && (
        <div className="space-y-2">
          <SectionCard {...SECTIONS[0]} isEmpty={!report.activity}>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="걸음" value={report.activity?.totalSteps?.toLocaleString() ?? null} />
              <Stat label="활동" value={report.activity?.totalActiveMinutes ?? null} unit="분" />
              <Stat label="소모" value={report.activity?.totalActiveKcal?.toFixed(0) ?? null} unit="kcal" />
            </div>
          </SectionCard>

          <SectionCard {...SECTIONS[1]} isEmpty={!report.sleep}>
            <div className="grid grid-cols-4 gap-3">
              <Stat label="수면" value={report.sleep?.totalMinutes ?? null} unit="분" />
              <Stat label="깊은수면" value={report.sleep?.deepSleepMinutes ?? null} unit="분" />
              <Stat label="REM" value={report.sleep?.remSleepMinutes ?? null} unit="분" />
              <Stat label="점수" value={report.sleep?.sleepScore?.toFixed(1) ?? null} />
            </div>
          </SectionCard>

          <SectionCard {...SECTIONS[2]} isEmpty={!report.nutrition}>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="칼로리" value={report.nutrition?.totalKcal?.toFixed(0) ?? null} unit="kcal" />
              <Stat label="탄수화물" value={report.nutrition?.totalCarbsG?.toFixed(1) ?? null} unit="g" />
              <Stat label="단백질" value={report.nutrition?.totalProteinG?.toFixed(1) ?? null} unit="g" />
              <Stat label="지방" value={report.nutrition?.totalFatG?.toFixed(1) ?? null} unit="g" />
              <Stat label="식사" value={report.nutrition?.mealCount ?? null} unit="회" />
            </div>
          </SectionCard>

          <SectionCard {...SECTIONS[3]} isEmpty={!report.hydration}>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="수분" value={report.hydration?.totalVolumeMl?.toFixed(0) ?? null} unit="ml" />
              <Stat label="카페인" value={report.hydration?.totalCaffeineMg?.toFixed(0) ?? null} unit="mg" />
              <Stat label="당분" value={report.hydration?.totalSugarG?.toFixed(1) ?? null} unit="g" />
            </div>
          </SectionCard>

          <SectionCard {...SECTIONS[4]} isEmpty={!report.intakes}>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="예정" value={report.intakes?.scheduledCount ?? null} />
              <Stat label="완료" value={report.intakes?.takenCount ?? null} />
              <Stat label="건너뜀" value={report.intakes?.skippedCount ?? null} />
            </div>
            {report.intakes && report.intakes.scheduledCount > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-[#888] mb-1">
                  <span>복약 완료율</span>
                  <span className="font-semibold text-[#444]">
                    {Math.round((report.intakes.takenCount / report.intakes.scheduledCount) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-[#ebebeb] rounded-full h-1.5">
                  <div
                    className="bg-[#555] h-1.5 rounded-full transition-all"
                    style={{ width: `${(report.intakes.takenCount / report.intakes.scheduledCount) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard {...SECTIONS[5]} isEmpty={!report.reminders}>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="예정" value={report.reminders?.scheduledCount ?? null} />
              <Stat label="전송" value={report.reminders?.sentCount ?? null} />
              <Stat label="실패" value={report.reminders?.failedCount ?? null} />
            </div>
          </SectionCard>

          <p className="text-center text-[11px] text-[#bbb] pt-1">건강 관리 참고용이며 의학적 진단이 아닙니다</p>
        </div>
      )}
    </div>
  );
}
