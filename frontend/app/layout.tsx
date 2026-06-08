import type { Metadata } from 'next';
import { AppShell } from './app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: '건강 One App',
  description: '건강 관리 앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="app-bg">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
