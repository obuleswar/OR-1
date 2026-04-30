
'use client';

import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, User } from 'lucide-react';

function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tighter text-white hover:opacity-90 transition-opacity">
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
        >
          <path
            d="M15 20H45V80H15V20ZM27 32V68H33V32H27Z"
            fill="currentColor"
            className="text-primary"
          />
          <path
            d="M48 20H75C85 20 85 45 75 45H48V20ZM60 32V45H75C78 45 78 32 75 32H60Z"
            fill="currentColor"
            className="text-primary"
          />
          <path
            d="M48 50H65L85 80H70L50 50H48V50Z"
            fill="currentColor"
            className="text-primary"
          />
        </svg>
      </div>
      <span className="tracking-widest uppercase text-base">OR WALLET</span>
    </Link>
  );
}

export function Header() {
  const { user, isUserLoading } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a] shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Sidebar Icon */}
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/5">
            <LayoutDashboard className="h-5 w-5" />
          </Button>
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <HeaderLogo />
        </div>

        {/* Right: Profile Indicator */}
        <div className="flex items-center">
          {!isUserLoading && user ? (
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full border border-primary bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {user.email?.[0].toUpperCase() || <User className="h-4 w-4" />}
              </div>
            </Link>
          ) : (
            !isUserLoading && (
              <Link href="/login">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8 px-4 rounded-full">
                  Sign In
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
