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
    <nav className="bg-[#fbfbfa] border-b border-[#e8e8e5] sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 flex items-center gap-1 h-12">
        <Link href="/" className="flex items-center gap-1.5 mr-4 shrink-0">
          <span className="text-base">🌿</span>
          <span className="font-semibold text-[#111] text-[13px]">건강 One</span>
        </Link>
        {NAV.map(({ href, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-[#ebebeb] text-[#111]'
                  : 'text-[#666] hover:bg-[#f0f0ee] hover:text-[#111]'
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
