'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DEMO_TODAY, isDemoModeEnabled } from '@/lib/demo-data';
import type { DailyReport } from '@/lib/types';

const SECTION_META = {
  activity:  { icon: '🏃', label: '활동',  iconBg: 'bg-[#fdf6ec]' },
  sleep:     { icon: '😴', label: '수면',  iconBg: 'bg-[#eff4fc]' },
  nutrition: { icon: '🥗', label: '영양',  iconBg: 'bg-[#f0f7f0]' },
  hydration: { icon: '💧', label: '수분',  iconBg: 'bg-[#eef5fc]' },
  intakes:   { icon: '💊', label: '복약',  iconBg: 'bg-[#f5f0fc]' },
  reminders: { icon: '🔔', label: '알림',  iconBg: 'bg-[#f0f0ee]' },
};

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

function SectionCard({
  sectionKey, primary, isEmpty, children,
}: {
  sectionKey: keyof typeof SECTION_META;
  primary?: { value: string | null; unit?: string };
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const { icon, label, iconBg } = SECTION_META[sectionKey];
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-[15px] ${iconBg}`}>{icon}</span>
          <h2 className="section-title">{label}</h2>
        </div>
        {primary?.value != null && (
          <p className="text-[18px] font-bold text-[#1a1a1a] leading-none">
            {primary.value}
            {primary.unit && <span className="text-[12px] font-medium text-[#888] ml-0.5">{primary.unit}</span>}
          </p>
        )}
      </div>
      <div className="h-px bg-[#f0f0ee] mb-3" />
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

  const intakePct = report?.intakes && report.intakes.scheduledCount > 0
    ? Math.round((report.intakes.takenCount / report.intakes.scheduledCount) * 100)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#111]">오늘의 건강</h1>
          {report && <p className="text-[12px] text-[#999] mt-0.5">{report.date} · {report.timezone}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-auto text-xs"
          />
          <button onClick={() => load(date)} disabled={loading} className="btn-primary text-xs py-1.5 px-3">
            {loading
              ? <span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin inline-block" />
              : '조회'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card bg-[#fff8f8] border-[#fecaca]">
          <p className="text-[13px] text-red-600">⚠️ {error}</p>
        </div>
      )}

      {loading && !report && (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-[#555] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {report && (
        <div className="space-y-2.5">
          <SectionCard
            sectionKey="activity"
            primary={{ value: report.activity?.totalSteps?.toLocaleString() ?? null, unit: '걸음' }}
            isEmpty={!report.activity}
          >
            <div className="grid grid-cols-3 gap-3">
              <Stat label="걸음" value={report.activity?.totalSteps?.toLocaleString() ?? null} />
              <Stat label="활동" value={report.activity?.totalActiveMinutes ?? null} unit="분" />
              <Stat label="소모" value={report.activity?.totalActiveKcal?.toFixed(0) ?? null} unit="kcal" />
            </div>
          </SectionCard>

          <SectionCard
            sectionKey="sleep"
            primary={report.sleep?.totalMinutes != null
              ? { value: (report.sleep.totalMinutes / 60).toFixed(1), unit: 'h' }
              : { value: null }}
            isEmpty={!report.sleep}
          >
            <div className="grid grid-cols-4 gap-3">
              <Stat label="수면" value={report.sleep?.totalMinutes ?? null} unit="분" />
              <Stat label="깊은수면" value={report.sleep?.deepSleepMinutes ?? null} unit="분" />
              <Stat label="REM" value={report.sleep?.remSleepMinutes ?? null} unit="분" />
              <Stat label="점수" value={report.sleep?.sleepScore?.toFixed(1) ?? null} />
            </div>
          </SectionCard>

          <SectionCard
            sectionKey="nutrition"
            primary={{ value: report.nutrition?.totalKcal?.toFixed(0) ?? null, unit: 'kcal' }}
            isEmpty={!report.nutrition}
          >
            <div className="grid grid-cols-3 gap-3">
              <Stat label="칼로리" value={report.nutrition?.totalKcal?.toFixed(0) ?? null} unit="kcal" />
              <Stat label="탄수화물" value={report.nutrition?.totalCarbsG?.toFixed(1) ?? null} unit="g" />
              <Stat label="단백질" value={report.nutrition?.totalProteinG?.toFixed(1) ?? null} unit="g" />
              <Stat label="지방" value={report.nutrition?.totalFatG?.toFixed(1) ?? null} unit="g" />
              <Stat label="식사" value={report.nutrition?.mealCount ?? null} unit="회" />
            </div>
          </SectionCard>

          <SectionCard
            sectionKey="hydration"
            primary={{ value: report.hydration?.totalVolumeMl?.toFixed(0) ?? null, unit: 'ml' }}
            isEmpty={!report.hydration}
          >
            <div className="grid grid-cols-3 gap-3">
              <Stat label="수분" value={report.hydration?.totalVolumeMl?.toFixed(0) ?? null} unit="ml" />
              <Stat label="카페인" value={report.hydration?.totalCaffeineMg?.toFixed(0) ?? null} unit="mg" />
              <Stat label="당분" value={report.hydration?.totalSugarG?.toFixed(1) ?? null} unit="g" />
            </div>
          </SectionCard>

          <SectionCard
            sectionKey="intakes"
            primary={report.intakes ? { value: `${report.intakes.takenCount}/${report.intakes.scheduledCount}` } : { value: null }}
            isEmpty={!report.intakes}
          >
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="예정" value={report.intakes?.scheduledCount ?? null} />
              <Stat label="완료" value={report.intakes?.takenCount ?? null} />
              <Stat label="건너뜀" value={report.intakes?.skippedCount ?? null} />
            </div>
            {intakePct !== null && (
              <div>
                <div className="flex justify-between text-[11px] text-[#888] mb-1.5">
                  <span>복약 완료율</span>
                  <span className="font-bold text-[#333]">{intakePct}%</span>
                </div>
                <div className="w-full bg-[#ebebeb] rounded-full h-1.5">
                  <div className="bg-[#333] h-1.5 rounded-full transition-all" style={{ width: `${intakePct}%` }} />
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            sectionKey="reminders"
            primary={report.reminders ? { value: String(report.reminders.sentCount), unit: '전송' } : { value: null }}
            isEmpty={!report.reminders}
          >
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
