'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DEMO_WEEK_START, isDemoModeEnabled } from '@/lib/demo-data';
import type { WeeklyReport } from '@/lib/types';

const SECTION_META = {
  activity:  { icon: '🏃', label: '활동',  iconBg: 'bg-[#fdf6ec]' },
  sleep:     { icon: '😴', label: '수면',  iconBg: 'bg-[#eff4fc]' },
  nutrition: { icon: '🥗', label: '영양',  iconBg: 'bg-[#f0f7f0]' },
  hydration: { icon: '💧', label: '수분',  iconBg: 'bg-[#eef5fc]' },
  intakes:   { icon: '💊', label: '복약',  iconBg: 'bg-[#f5f0fc]' },
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

function SummaryTile({
  label, value, unit, sub,
}: { label: string; value: React.ReactNode; unit?: string; sub?: string }) {
  return (
    <div className="bg-[#fafaf8] rounded-xl p-3.5">
      <p className="stat-label mb-1">{label}</p>
      <p className="text-[22px] font-bold text-[#111] leading-tight">
        {value}
        {unit && <span className="text-[13px] font-medium text-[#888] ml-0.5">{unit}</span>}
      </p>
      {sub && <p className="text-[11px] text-[#999] mt-0.5">{sub}</p>}
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

  const adherencePct = report?.intakes?.adherenceRate != null
    ? Math.round(report.intakes.adherenceRate * 100)
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#111]">주간 리포트</h1>
          {report && (
            <p className="text-[12px] text-[#999] mt-0.5">
              {report.weekStart} ~ {report.weekEnd} · {report.timezone}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] text-[#aaa]">주 시작 (월)</span>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="input w-auto text-xs"
            />
          </div>
          <button onClick={() => load(weekStart)} disabled={loading} className="btn-primary text-xs py-1.5 px-3 self-end">
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
          {/* 주간 요약 */}
          <div className="card">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#f0f0ee] text-[15px]">📊</span>
              <h2 className="section-title">이번 주 요약</h2>
            </div>
            <div className="h-px bg-[#f0f0ee] mb-3" />
            <div className="grid grid-cols-2 gap-2.5">
              <SummaryTile
                label="총 걸음 수"
                value={report.activity?.totalSteps?.toLocaleString() ?? <span className="text-[#ccc] text-[18px]">—</span>}
                sub={report.activity?.activeDays != null ? `활동한 날 ${report.activity.activeDays}일` : undefined}
              />
              <SummaryTile
                label="평균 수면"
                value={report.sleep?.avgTotalMinutes != null
                  ? (report.sleep.avgTotalMinutes / 60).toFixed(1)
                  : <span className="text-[#ccc] text-[18px]">—</span>}
                unit={report.sleep?.avgTotalMinutes != null ? 'h/일' : undefined}
                sub={report.sleep?.recordedDays != null ? `기록한 날 ${report.sleep.recordedDays}일` : undefined}
              />
              <SummaryTile
                label="평균 칼로리"
                value={report.nutrition?.avgTotalKcal?.toFixed(0) ?? <span className="text-[#ccc] text-[18px]">—</span>}
                unit={report.nutrition?.avgTotalKcal != null ? 'kcal' : undefined}
                sub={report.nutrition?.recordedDays != null ? `기록한 날 ${report.nutrition.recordedDays}일` : undefined}
              />
              <SummaryTile
                label="복약 준수율"
                value={adherencePct != null
                  ? adherencePct
                  : <span className="text-[#ccc] text-[18px]">—</span>}
                unit={adherencePct != null ? '%' : undefined}
                sub={report.intakes ? `${report.intakes.totalTaken}/${report.intakes.totalScheduled} 완료` : undefined}
              />
            </div>
          </div>

          <SectionCard
            sectionKey="activity"
            primary={{ value: report.activity?.totalSteps?.toLocaleString() ?? null, unit: '걸음' }}
            isEmpty={!report.activity}
          >
            <div className="grid grid-cols-2 gap-3">
              <Stat label="총 걸음 수" value={report.activity?.totalSteps?.toLocaleString() ?? null} />
              <Stat label="평균 활동" value={report.activity?.avgActiveMinutes?.toFixed(1) ?? null} unit="분" />
              <Stat label="총 소모" value={report.activity?.totalActiveKcal?.toFixed(0) ?? null} unit="kcal" />
              <Stat label="활동한 날" value={report.activity ? `${report.activity.activeDays}일` : null} />
            </div>
          </SectionCard>

          <SectionCard
            sectionKey="sleep"
            primary={report.sleep?.avgTotalMinutes != null
              ? { value: (report.sleep.avgTotalMinutes / 60).toFixed(1), unit: 'h/일' }
              : { value: null }}
            isEmpty={!report.sleep}
          >
            <div className="grid grid-cols-3 gap-3">
              <Stat label="평균 수면" value={report.sleep?.avgTotalMinutes?.toFixed(0) ?? null} unit="분" />
              <Stat label="평균 점수" value={report.sleep?.avgSleepScore?.toFixed(1) ?? null} />
              <Stat label="기록한 날" value={report.sleep ? `${report.sleep.recordedDays}일` : null} />
            </div>
          </SectionCard>

          <SectionCard
            sectionKey="nutrition"
            primary={{ value: report.nutrition?.avgTotalKcal?.toFixed(0) ?? null, unit: 'kcal/일' }}
            isEmpty={!report.nutrition}
          >
            <div className="grid grid-cols-2 gap-3">
              <Stat label="평균 칼로리" value={report.nutrition?.avgTotalKcal?.toFixed(0) ?? null} unit="kcal" />
              <Stat label="기록한 날" value={report.nutrition ? `${report.nutrition.recordedDays}일` : null} />
            </div>
          </SectionCard>

          <SectionCard
            sectionKey="hydration"
            primary={{ value: report.hydration?.avgVolumeMl?.toFixed(0) ?? null, unit: 'ml/일' }}
            isEmpty={!report.hydration}
          >
            <div className="grid grid-cols-2 gap-3">
              <Stat label="평균 섭취량" value={report.hydration?.avgVolumeMl?.toFixed(0) ?? null} unit="ml" />
              <Stat label="평균 카페인" value={report.hydration?.avgCaffeineMg?.toFixed(0) ?? null} unit="mg" />
            </div>
          </SectionCard>

          <SectionCard
            sectionKey="intakes"
            primary={adherencePct != null ? { value: `${adherencePct}%` } : { value: null }}
            isEmpty={!report.intakes}
          >
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="총 예정" value={report.intakes?.totalScheduled ?? null} />
              <Stat label="총 완료" value={report.intakes?.totalTaken ?? null} />
              <div>
                <p className="stat-label">준수율</p>
                <p className="stat-value">
                  {adherencePct !== null ? `${adherencePct}%` : <span className="text-[#ccc]">—</span>}
                </p>
              </div>
            </div>
            {adherencePct !== null ? (
              <div>
                <div className="flex justify-between text-[11px] text-[#888] mb-1.5">
                  <span>주간 복약 완료율</span>
                  <span className="font-bold text-[#333]">{adherencePct}%</span>
                </div>
                <div className="w-full bg-[#ebebeb] rounded-full h-2">
                  <div className="bg-[#333] h-2 rounded-full transition-all" style={{ width: `${adherencePct}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#aaa]">기록 없음</p>
            )}
          </SectionCard>

          <p className="text-center text-[11px] text-[#bbb] pt-1">건강 관리 참고용이며 의학적 진단이 아닙니다</p>
        </div>
      )}
    </div>
  );
}
