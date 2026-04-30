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
          {/* Stylized 'o' */}
          <path
            d="M40 35C28.9543 35 20 43.9543 20 55C20 66.0457 28.9543 75 40 75C51.0457 75 60 66.0457 60 55C60 43.9543 51.0457 35 40 35ZM40 65C34.4772 65 30 60.5228 30 55C30 49.4772 34.4772 45 40 45C45.5228 45 50 49.4772 50 55C50 60.5228 45.5228 65 40 65Z"
            fill="currentColor"
            className="text-primary"
          />
          {/* Stylized 'r' integrated with 'o' */}
          <path
            d="M58 45V75H68V55C68 48 72 45 78 45V35C70 35 65 40 62 45V35H52V75H62V45H58Z"
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
