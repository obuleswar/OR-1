'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  if (!user) return null;

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Earn', href: '/earn', icon: Zap },
    { label: 'Wallet', href: '/dashboard', icon: Wallet },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/5 pb-safe">
      <div className="container mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive ? 'text-primary' : 'text-white/60 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
