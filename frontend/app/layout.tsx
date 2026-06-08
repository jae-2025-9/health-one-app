import type { Metadata } from 'next';
import NavBar from './components/NavBar';
import './globals.css';

export const metadata: Metadata = {
  title: '건강 One App',
  description: '건강 관리 앱',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#f4f6f9]">
        <NavBar />
        <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
