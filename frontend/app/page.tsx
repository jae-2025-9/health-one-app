'use client';

import Link from 'next/link';
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
      <h2 className="section-title mb-3">{title}</h2>
      {isEmpty ? <p className="empty-state">오늘 기록 없음</p> : children}
    </div>
  );
}

export default function HomePage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiNotice, setAiNotice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

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

  async function askAi() {
    const question = aiQuestion.trim();
    if (!question) return;

    setAiLoading(true);
    setAiError('');
    setAiAnswer('');
    setAiNotice('');
    try {
      const data = await api.ai.ask({
        question,
        date: report?.date ?? date,
      });
      setAiAnswer(data.answer);
      setAiNotice(data.safetyNotice);
    } catch (e) {
      setAiError((e as Error).message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[15px] font-semibold text-[#111111]">오늘의 건강 요약</h1>
            <p className="text-[12px] text-[#666666]">{date || '날짜 선택'}</p>
          </div>
          <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-[138px]"
          />
          <button onClick={() => load(date)} disabled={loading} className="btn-primary">
            {loading ? '로딩중…' : '조회'}
          </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {report && (
        <>
          <div className="summary-grid">
            <div className="summary-tile">
              <p className="stat-label">걸음수</p>
              <p className="stat-value">{report.activity?.totalSteps?.toLocaleString() ?? '-'}</p>
              <p className="text-[10px] text-[#777777]">목표 10,000</p>
            </div>
            <div className="summary-tile">
              <p className="stat-label">활동량</p>
              <p className="stat-value">{report.activity?.totalActiveKcal?.toFixed(0) ?? '-'}</p>
              <p className="text-[10px] text-[#777777]">kcal</p>
            </div>
            <div className="summary-tile">
              <p className="stat-label">수면</p>
              <p className="stat-value">{report.sleep?.totalMinutes ? `${Math.floor(report.sleep.totalMinutes / 60)}시간` : '-'}</p>
              <p className="text-[10px] text-[#777777]">{report.sleep?.sleepScore ? `점수 ${report.sleep.sleepScore}` : '목표 8시간'}</p>
            </div>
            <div className="summary-tile">
              <p className="stat-label">식사 칼로리</p>
              <p className="stat-value">{report.nutrition?.totalKcal?.toFixed(0) ?? '-'}</p>
              <p className="text-[10px] text-[#777777]">kcal</p>
            </div>
            <div className="summary-tile">
              <p className="stat-label">음용량</p>
              <p className="stat-value">{report.hydration?.totalVolumeMl ? `${(report.hydration.totalVolumeMl / 1000).toFixed(1)}L` : '-'}</p>
              <p className="text-[10px] text-[#777777]">물/커피/캔음료</p>
            </div>
            <div className="summary-tile">
              <p className="stat-label">복용 알림</p>
              <p className="stat-value">{report.intakes?.scheduledCount ?? '-'}</p>
              <p className="text-[10px] text-[#777777]">예정</p>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title mb-2">AI 주의사항</h2>
            <p className="quiet-note">
              활동, 식사, 음용, 복약, 화장품 사용 기록을 같은 health_events 흐름으로 모아
              건강 패턴을 참고 정보로 보여줍니다.
            </p>
          </div>

          <div className="card space-y-3">
            <h2 className="section-title">AI 질문</h2>
            <div className="quick-link-grid">
              <Link href="/ai?mode=meds" className="quick-link">약/영양제 바로 질문</Link>
              <Link href="/ai?mode=cosmetics" className="quick-link">화장품 성분 바로 질문</Link>
            </div>
            <textarea
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              maxLength={1000}
              className="input min-h-[96px] resize-none leading-5"
              placeholder="오늘 기록을 보고 컨디션 관리 팁 알려줘"
            />
            <button
              onClick={askAi}
              disabled={aiLoading || !aiQuestion.trim()}
              className="btn-primary w-full"
            >
              {aiLoading ? '답변 생성중…' : '질문하기'}
            </button>
            {aiError && <p className="text-sm text-red-500">{aiError}</p>}
            {aiAnswer && (
              <div className="quiet-note space-y-2">
                <p>{aiAnswer}</p>
                {aiNotice && <p className="text-[11px] text-[#666666]">{aiNotice}</p>}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="section-title mb-3">오늘의 할 일</h2>
            <div className="space-y-2 text-sm">
              <label className="flex items-center justify-between rounded-md border border-[#d2d2cc] bg-white px-3 py-2">
                <span>아침 약 복용</span><span className="text-[#777777]">09:00 ○</span>
              </label>
              <label className="flex items-center justify-between rounded-md border border-[#d2d2cc] bg-white px-3 py-2">
                <span>식사 사진 기록</span><span className="text-[#777777]">12:30 ○</span>
              </label>
              <label className="flex items-center justify-between rounded-md border border-[#d2d2cc] bg-white px-3 py-2">
                <span>저녁 수분 체크</span><span className="text-[#777777]">20:00 ○</span>
              </label>
            </div>
          </div>

          <p className="text-xs text-[#777777]">{report.date} · {report.timezone}</p>

          <Section title="활동" isEmpty={!report.activity}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="걸음 수" value={report.activity?.totalSteps?.toLocaleString() ?? null} />
              <StatCard label="활동 시간(분)" value={report.activity?.totalActiveMinutes ?? null} />
              <StatCard label="소모 칼로리" value={report.activity?.totalActiveKcal?.toFixed(1) ?? null} />
            </div>
          </Section>

          <Section title="수면" isEmpty={!report.sleep}>
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="총 수면(분)" value={report.sleep?.totalMinutes ?? null} />
              <StatCard label="깊은 수면(분)" value={report.sleep?.deepSleepMinutes ?? null} />
              <StatCard label="REM(분)" value={report.sleep?.remSleepMinutes ?? null} />
              <StatCard label="수면 점수" value={report.sleep?.sleepScore?.toFixed(1) ?? null} />
            </div>
          </Section>

          <Section title="식사" isEmpty={!report.nutrition}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="칼로리(kcal)" value={report.nutrition?.totalKcal?.toFixed(0) ?? null} />
              <StatCard label="탄수화물(g)" value={report.nutrition?.totalCarbsG?.toFixed(1) ?? null} />
              <StatCard label="단백질(g)" value={report.nutrition?.totalProteinG?.toFixed(1) ?? null} />
              <StatCard label="지방(g)" value={report.nutrition?.totalFatG?.toFixed(1) ?? null} />
              <StatCard label="식사 횟수" value={report.nutrition?.mealCount ?? null} />
            </div>
          </Section>

          <Section title="음용" isEmpty={!report.hydration}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="섭취량(ml)" value={report.hydration?.totalVolumeMl?.toFixed(0) ?? null} />
              <StatCard label="카페인(mg)" value={report.hydration?.totalCaffeineMg?.toFixed(1) ?? null} />
              <StatCard label="당분(g)" value={report.hydration?.totalSugarG?.toFixed(1) ?? null} />
            </div>
          </Section>

          <Section title="복약" isEmpty={!report.intakes}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="예정" value={report.intakes?.scheduledCount ?? null} />
              <StatCard label="복용 완료" value={report.intakes?.takenCount ?? null} />
              <StatCard label="건너뜀" value={report.intakes?.skippedCount ?? null} />
            </div>
          </Section>

          <Section title="알림" isEmpty={!report.reminders}>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="예정" value={report.reminders?.scheduledCount ?? null} />
              <StatCard label="전송 완료" value={report.reminders?.sentCount ?? null} />
              <StatCard label="실패" value={report.reminders?.failedCount ?? null} />
            </div>
          </Section>

          <p className="text-xs text-[#777777] text-center pt-2">
            이 리포트는 건강 관리 참고용이며 진단이 아닙니다.
          </p>
        </>
      )}
    </div>
  );
}
