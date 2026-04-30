'use client';

import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Wallet } from 'lucide-react';

function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
      <Wallet className="h-8 w-8" />
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
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <HeaderLogo />
        <nav className="flex items-center gap-4">
          <Link href="/upload" className="text-sm font-medium hover:text-primary hidden sm:inline">
            Add Transaction
          </Link>
          {!isUserLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
