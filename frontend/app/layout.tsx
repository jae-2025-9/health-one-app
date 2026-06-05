import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: '건강 One App',
  description: '건강 관리 앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="app-bg">
        <div className="phone-shell">
          <header className="app-topbar">
            <span className="icon-button" aria-hidden="true">≡</span>
            <Link href="/" className="app-title">건강 one app</Link>
            <Link href="/reminders" className="icon-button" aria-label="알림">⌾</Link>
          </header>
          <main className="app-main">{children}</main>
          <nav className="bottom-tabs" aria-label="주요 메뉴">
            <Link href="/" className="bottom-tab">
              <span aria-hidden="true">⌂</span>
              <span>홈</span>
            </Link>
            <Link href="/integrations" className="bottom-tab">
              <span aria-hidden="true">↻</span>
              <span>연동</span>
            </Link>
            <Link href="/reminders/new" className="bottom-tab bottom-tab-plus" aria-label="알림 추가">
              <span aria-hidden="true">＋</span>
            </Link>
            <Link href="/reports/weekly" className="bottom-tab">
              <span aria-hidden="true">▤</span>
              <span>리포트</span>
            </Link>
            <Link href="/reminders" className="bottom-tab">
              <span aria-hidden="true">⋯</span>
              <span>더보기</span>
            </Link>
          </nav>
        </div>
      </body>
    </html>
  );
}
