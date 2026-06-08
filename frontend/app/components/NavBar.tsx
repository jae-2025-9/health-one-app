'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',                 label: '홈' },
  { href: '/reminders',        label: '알림' },
  { href: '/reports/weekly',   label: '주간 리포트' },
  { href: '/integrations',     label: '연동' },
  { href: '/ai',               label: '🤖 AI' },
];

export default function NavBar() {
  const path = usePathname();

  return (
    <nav className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 flex items-center gap-1 h-14">
        <Link href="/" className="flex items-center gap-1.5 mr-4 shrink-0">
          <span className="text-xl">🌿</span>
          <span className="font-bold text-gray-900 text-sm">건강 One</span>
        </Link>
        {NAV.map(({ href, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
