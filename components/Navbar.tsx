'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ShoppingBag, TrendingUp, Briefcase, Clapperboard,
  Newspaper, MessageCircle, User, Settings, Store,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/marketplace', label: 'Market', icon: ShoppingBag },
  { href: '/tech-trends', label: 'Tech', icon: TrendingUp },
  { href: '/business-trends', label: 'Biz', icon: Briefcase },
  { href: '/business', label: 'Store', icon: Store },
  { href: '/reels', label: 'Reels', icon: Clapperboard },
  { href: '/blog', label: 'Blog', icon: Newspaper },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-20">
      <div className="max-w-2xl mx-auto flex overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] text-xs shrink-0 ${
                active ? 'text-brand' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              <span className="mt-0.5">{label}</span>
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] text-xs shrink-0 ${
            pathname === '/settings' ? 'text-brand' : 'text-gray-400'
          }`}
        >
          <Settings size={20} />
          <span className="mt-0.5">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
