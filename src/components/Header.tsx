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
        {/* Combined O and R shape */}
        <path
          d="M10,25 Q10,10 25,10 L50,10 L50,90 L25,90 Q10,90 10,75 Z M25,25 L25,75 Q25,80 30,80 L35,80 Q40,80 40,75 L40,25 Q40,20 35,20 L30,20 Q25,20 25,25 Z"
          fill="#52ffb8"
        />
        <path
          d="M50,10 L80,10 Q95,10 95,25 L95,45 Q95,55 85,55 L65,55 L65,90 L50,90 Z M65,22 L65,43 L80,43 Q85,43 85,38 L85,27 Q85,22 80,22 Z"
          fill="#52ffb8"
        />
        {/* Connection bridge to combine them visually */}
        <rect x="40" y="35" width="20" height="10" fill="#52ffb8" />
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
