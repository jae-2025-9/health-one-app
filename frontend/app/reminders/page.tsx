'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ReminderRule } from '@/lib/types';

const TARGET_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  intake:    { label: '복약',  bg: 'bg-purple-100', text: 'text-purple-700' },
  hydration: { label: '수분',  bg: 'bg-cyan-100',   text: 'text-cyan-700'   },
  sleep:     { label: '수면',  bg: 'bg-indigo-100', text: 'text-indigo-700' },
  activity:  { label: '활동',  bg: 'bg-blue-100',   text: 'text-blue-700'   },
  custom:    { label: '기타',  bg: 'bg-gray-100',   text: 'text-gray-700'   },
};

export default function RemindersPage() {
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    api.reminders.list()
      .then(setRules)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(rule: ReminderRule) {
    setToggling(rule.id);
    try {
      const updated = await api.reminders.patch(rule.id, { isActive: !rule.isActive });
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setToggling(null);
    }
  }

  const active = rules.filter((r) => r.isActive);
  const inactive = rules.filter((r) => !r.isActive);

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
          <p className="text-sm text-gray-400 mt-0.5">{rules.length}개 규칙</p>
        </div>
        <Link href="/reminders/new" className="btn-primary">+ 알림 추가</Link>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {rules.length === 0 && !error && (
        <div className="card flex flex-col items-center justify-center py-14 gap-3">
          <span className="text-5xl opacity-20">🔔</span>
          <p className="text-gray-400 font-medium">등록된 알림이 없어요</p>
          <Link href="/reminders/new" className="btn-primary mt-1">첫 알림 추가하기</Link>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">활성</p>
          {active.map((rule) => <RuleCard key={rule.id} rule={rule} toggling={toggling} onToggle={toggleActive} />)}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">비활성</p>
          {inactive.map((rule) => <RuleCard key={rule.id} rule={rule} toggling={toggling} onToggle={toggleActive} />)}
        </div>
      )}
    </div>
  );
}

function RuleCard({
  rule, toggling, onToggle,
}: { rule: ReminderRule; toggling: string | null; onToggle: (r: ReminderRule) => void }) {
  const cfg = TARGET_CONFIG[rule.targetType] ?? TARGET_CONFIG.custom;
  return (
    <div className={`card flex items-center gap-4 transition-opacity ${!rule.isActive ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`badge ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
          <p className="font-semibold text-gray-900 truncate">{rule.title}</p>
        </div>
        <p className="text-xs text-gray-400 font-mono truncate">{rule.rrule}</p>
      </div>
      <button
        onClick={() => onToggle(rule)}
        disabled={toggling === rule.id}
        className={`toggle ${rule.isActive ? 'bg-green-500' : 'bg-gray-200'} ${toggling === rule.id ? 'opacity-50' : ''}`}
        aria-label={rule.isActive ? '비활성화' : '활성화'}
      >
        <span className={`toggle-thumb ${rule.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
