'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ReminderRule } from '@/lib/types';

const TARGET_LABEL: Record<string, string> = {
  intake: '복약',
  hydration: '수분',
  sleep: '수면',
  activity: '활동',
  custom: '기타',
};

export default function RemindersPage() {
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api.reminders.list();
      setRules(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

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

  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-gray-400 text-sm">로딩중…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">알림 설정</h1>
        <Link href="/reminders/new" className="btn-primary">+ 알림 추가</Link>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {rules.length === 0 && !error && (
        <div className="card text-center py-10">
          <p className="text-gray-400 mb-3">등록된 알림 규칙이 없어요</p>
          <Link href="/reminders/new" className="btn-primary">첫 알림 추가하기</Link>
        </div>
      )}

      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="card flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {TARGET_LABEL[rule.targetType] ?? rule.targetType}
                </span>
                <p className="font-medium text-gray-900 truncate">{rule.title}</p>
              </div>
              <p className="text-xs text-gray-400 font-mono truncate">{rule.rrule}</p>
            </div>
            <button
              onClick={() => toggleActive(rule)}
              disabled={toggling === rule.id}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors
                ${rule.isActive ? 'bg-green-500' : 'bg-gray-200'}
                ${toggling === rule.id ? 'opacity-50' : 'cursor-pointer'}`}
              aria-label={rule.isActive ? '비활성화' : '활성화'}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform
                  ${rule.isActive ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
