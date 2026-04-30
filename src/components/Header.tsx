'use client';

import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { LayoutDashboard } from 'lucide-react';

function CustomLogo() {
  return (
    <div className="flex items-center justify-center p-0.5 w-12 h-12">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10,20 C10,12 18,10 25,10 H75 C88,10 95,17 95,30 V45 C95,58 88,65 75,65 H60 L85,90 H65 L48,70 V90 H30 V65 H10 V20 Z M28,25 V50 H38 V25 H28 Z M55,25 V50 H78 V25 H55 Z"
          fill="currentColor"
          className="text-primary"
        />
      </svg>
    </div>
  );
}

function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white hover:opacity-90 transition-opacity">
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
