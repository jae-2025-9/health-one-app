'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const sideLinks = [
  { href: '/', label: '홈 대시보드', icon: '⌂' },
  { href: '/ai', label: 'AI 질문', icon: '◆' },
  { href: '/integrations', label: '활동/수면 연동', icon: '↻' },
  { href: '/reports/weekly', label: '주간 리포트', icon: '▤' },
  { href: '/reminders', label: '알림 설정', icon: '⌾' },
];

const quickActions = [
  { href: '/ai?mode=meds', label: '약/영양제 질문', desc: '복용, 시간, 주의 조합' },
  { href: '/ai?mode=cosmetics', label: '화장품 성분 질문', desc: '성분명, 피부 타입, 주의점' },
  { href: '/ai?mode=daily', label: '오늘 기록 질문', desc: '활동, 수면, 식사 요약' },
  { href: '/reminders/new', label: '알림 추가', desc: '복약/수분/생활 습관' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  function closePanels() {
    setSidebarOpen(false);
    setActionsOpen(false);
  }

  return (
    <div className="phone-shell">
      <header className="app-topbar">
        <button
          type="button"
          className="icon-button"
          aria-label="사이드바 열기"
          aria-expanded={sidebarOpen}
          onClick={() => {
            setActionsOpen(false);
            setSidebarOpen(true);
          }}
        >
          ≡
        </button>
        <Link href="/" className="app-title" onClick={closePanels}>건강 one app</Link>
        <Link href="/reminders" className="icon-button" aria-label="알림" onClick={closePanels}>⌾</Link>
      </header>

      {sidebarOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setSidebarOpen(false)}>
          <aside
            className="side-drawer"
            aria-label="사이드바 메뉴"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2c2c2c] pb-3">
              <div>
                <p className="text-[15px] font-semibold">건강 one app</p>
                <p className="text-[12px] text-[#666666]">생활 건강 인자 관리</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="사이드바 닫기"
                onClick={() => setSidebarOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className="mt-4 space-y-2" aria-label="사이드바 링크">
              {sideLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`side-link ${pathname === link.href ? 'side-link-active' : ''}`}
                  onClick={closePanels}
                >
                  <span aria-hidden="true">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="app-main">{children}</main>

      {actionsOpen && (
        <div className="action-backdrop" role="presentation" onClick={() => setActionsOpen(false)}>
          <div
            className="action-sheet"
            role="dialog"
            aria-label="빠른 추가 메뉴"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">빠른 실행</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="빠른 실행 닫기"
                onClick={() => setActionsOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="action-link"
                  onClick={closePanels}
                >
                  <span className="font-semibold">{action.label}</span>
                  <span className="text-[12px] text-[#666666]">{action.desc}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-tabs" aria-label="주요 메뉴">
        <Link href="/" className={`bottom-tab ${pathname === '/' ? 'bottom-tab-active' : ''}`} onClick={closePanels}>
          <span aria-hidden="true">⌂</span>
          <span>홈</span>
        </Link>
        <Link href="/integrations" className={`bottom-tab ${pathname === '/integrations' ? 'bottom-tab-active' : ''}`} onClick={closePanels}>
          <span aria-hidden="true">↻</span>
          <span>연동</span>
        </Link>
        <button
          type="button"
          className="bottom-tab bottom-tab-plus"
          aria-label="빠른 추가"
          aria-expanded={actionsOpen}
          onClick={() => {
            setSidebarOpen(false);
            setActionsOpen((open) => !open);
          }}
        >
          <span aria-hidden="true">＋</span>
        </button>
        <Link href="/reports/weekly" className={`bottom-tab ${pathname === '/reports/weekly' ? 'bottom-tab-active' : ''}`} onClick={closePanels}>
          <span aria-hidden="true">▤</span>
          <span>리포트</span>
        </Link>
        <Link href="/ai" className={`bottom-tab ${pathname === '/ai' ? 'bottom-tab-active' : ''}`} onClick={closePanels}>
          <span aria-hidden="true">◆</span>
          <span>AI</span>
        </Link>
      </nav>
    </div>
  );
}
