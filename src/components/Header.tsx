'use client';

import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Menu } from 'lucide-react';

function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 font-bold text-2xl tracking-tighter text-white hover:opacity-90 transition-opacity">
      <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10"
        >
          {/* Combined Capital O and R Design */}
          <path
            d="M15 25V75H45V62H28V38H45V25H15Z"
            fill="currentColor"
            className="text-primary"
          />
          <path
            d="M50 25V75H62V55H70L80 75H93L82 55C88 52 92 48 92 40C92 31 85 25 75 25H50ZM62 37H75C78 37 78 43 75 43H62V37Z"
            fill="currentColor"
            className="text-primary"
          />
        </svg>
      </div>
      <span className="tracking-widest uppercase">OR WALLET</span>
    </Link>
  );
}

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a] shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-4">
            <Menu className="h-8 w-8 text-white sm:hidden cursor-pointer" />
            <HeaderLogo />
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/upload" className="text-sm font-medium text-white/80 hover:text-white hidden sm:inline">
            Add Transaction
          </Link>
          {!isUserLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 text-white hover:bg-white/10">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="text-white border-white/20 hover:bg-white/10">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">Sign In</Button>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
