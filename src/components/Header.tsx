'use client';

import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Menu } from 'lucide-react';

function CustomLogo() {
  return (
    <div className="flex items-center justify-center p-0 w-16 h-12">
      <svg
        viewBox="0 0 100 60"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M15,5 H85 A10,10 0 0 1 95,15 V25 A10,10 0 0 1 85,35 H70 L90,55 H70 L55,35 H15 A10,10 0 0 1 5,25 V15 A10,10 0 0 1 15,5 Z M25,15 V25 H40 V15 Z M55,15 V25 H80 V15 Z"
          fill="currentColor"
          className="text-primary"
        />
      </svg>
    </div>
  );
}

function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-1 font-bold text-3xl tracking-tighter text-white hover:opacity-90 transition-opacity">
      <CustomLogo />
      OR WALLET
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
