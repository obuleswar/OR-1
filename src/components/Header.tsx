'use client';

import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { LayoutDashboard } from 'lucide-react';

function CustomLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-10 w-10 text-primary"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2 22l5-1.338C8.47 21.513 10.179 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  );
}

function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 font-bold text-2xl tracking-tighter text-white">
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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a] shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <HeaderLogo />
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
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">Sign In</Button>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
