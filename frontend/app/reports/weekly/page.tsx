'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DEMO_WEEK_START, isDemoModeEnabled } from '@/lib/demo-data';
import type { WeeklyReport } from '@/lib/types';

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
          <h1 className="text-[17px] font-semibold text-[#111]">주간 리포트</h1>
          {report && (
            <p className="text-[12px] text-[#888] mt-0.5">
              {report.weekStart} ~ {report.weekEnd} · {report.timezone}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[11px] text-[#888]">주 시작일 (월요일)</span>
            <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="input w-auto text-xs" />
          </div>
          <button onClick={() => load(weekStart)} disabled={loading} className="btn-primary text-xs py-1.5 px-3 self-end">
            {loading ? '…' : '조회'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card bg-[#fff5f5] border-[#fecaca]">
          <p className="text-[13px] text-red-600">⚠️ {error}</p>
        </div>
      )}

      {loading && !report && (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-[#555] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {report && (
        <div className="space-y-2">
          <SectionCard icon="🏃" label="활동" isEmpty={!report.activity}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="총 걸음 수" value={report.activity?.totalSteps?.toLocaleString() ?? null} />
              <Stat label="평균 활동" value={report.activity?.avgActiveMinutes?.toFixed(1) ?? null} unit="분" />
              <Stat label="총 소모" value={report.activity?.totalActiveKcal?.toFixed(0) ?? null} unit="kcal" />
              <Stat label="활동한 날" value={report.activity ? `${report.activity.activeDays}일` : null} />
            </div>
          </SectionCard>

          <SectionCard icon="😴" label="수면" isEmpty={!report.sleep}>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="평균 수면" value={report.sleep?.avgTotalMinutes?.toFixed(0) ?? null} unit="분" />
              <Stat label="평균 점수" value={report.sleep?.avgSleepScore?.toFixed(1) ?? null} />
              <Stat label="기록한 날" value={report.sleep ? `${report.sleep.recordedDays}일` : null} />
            </div>
          </SectionCard>

          <SectionCard icon="🥗" label="영양" isEmpty={!report.nutrition}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="평균 칼로리" value={report.nutrition?.avgTotalKcal?.toFixed(0) ?? null} unit="kcal" />
              <Stat label="기록한 날" value={report.nutrition ? `${report.nutrition.recordedDays}일` : null} />
            </div>
          </SectionCard>

          <SectionCard icon="💧" label="수분" isEmpty={!report.hydration}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="평균 섭취량" value={report.hydration?.avgVolumeMl?.toFixed(0) ?? null} unit="ml" />
              <Stat label="평균 카페인" value={report.hydration?.avgCaffeineMg?.toFixed(0) ?? null} unit="mg" />
            </div>
          </SectionCard>

          <SectionCard icon="💊" label="복약" isEmpty={!report.intakes}>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Stat label="총 예정" value={report.intakes?.totalScheduled ?? null} />
              <Stat label="총 완료" value={report.intakes?.totalTaken ?? null} />
              <div>
                <p className="stat-label">준수율</p>
                <p className="stat-value">{adherencePct !== null ? `${adherencePct}%` : <span className="text-[#ccc]">—</span>}</p>
              </div>
            </div>
            {adherencePct !== null ? (
              <div className="w-full bg-[#ebebeb] rounded-full h-1.5">
                <div className="bg-[#555] h-1.5 rounded-full transition-all" style={{ width: `${adherencePct}%` }} />
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
