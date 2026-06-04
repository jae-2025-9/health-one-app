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
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 flex gap-1 h-12 items-center">
            <Link href="/" className="font-bold text-green-600 mr-4 text-sm">건강 One</Link>
            <Link href="/" className="nav-link">홈</Link>
            <Link href="/reminders" className="nav-link">알림</Link>
            <Link href="/reports/weekly" className="nav-link">주간 리포트</Link>
            <Link href="/integrations" className="nav-link">연동</Link>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
