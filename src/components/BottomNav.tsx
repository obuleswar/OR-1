
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, IndianRupee, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();

  if (!user) return null;

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Earn', href: '/earn', icon: IndianRupee },
    { label: 'Wallet', href: '/dashboard', icon: Wallet },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-white/5 pb-safe shadow-2xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 transition-all duration-200 min-w-[64px]',
                isActive ? 'text-primary' : 'text-white/40 hover:text-white/60'
              )}
            >
              <div className={cn(
                'p-1 rounded-lg transition-colors',
                isActive && 'bg-primary/10'
              )}>
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
              </div>
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider',
                isActive ? 'opacity-100' : 'opacity-80'
              )}>{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
