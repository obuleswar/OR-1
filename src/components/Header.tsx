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
          d="M10,25 Q10,10 25,10 L45,10 Q60,10 60,25 L60,75 Q60,90 45,90 L25,90 Q10,90 10,75 Z M28,30 L28,70 Q28,75 33,75 L37,75 Q42,75 42,70 L42,30 Q42,25 37,25 L33,25 Q28,25 28,30 Z"
          fill="#52ffb8"
        />
        <path
          d="M65,10 L85,10 Q95,10 95,25 L95,45 Q95,55 85,55 L75,55 L75,90 L65,90 Z M75,22 L75,43 L85,43 Q87,43 87,41 L87,24 Q87,22 85,22 Z"
          fill="#52ffb8"
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
