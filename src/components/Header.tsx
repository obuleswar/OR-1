'use client';

import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';

function HeaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
      <svg
        version="1.0"
        xmlns="http://www.w3.org/2000/svg"
        width="512pt"
        height="512pt"
        viewBox="0 0 300.000000 300.000000"
        preserveAspectRatio="xMidYMid meet"
        className="fill-current h-8 w-8"
      >
        <g
          transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)"
          stroke="none"
        >
          <path d="M989 2498 c-180 -22 -312 -134 -360 -303 -21 -74 -21 -1246 0 -1320 35 -122 103 -212 198 -262 115 -60 122 -61 571 -55 l222 2 -2 450 -3 449 37 6 c49 9 92 -1 114 -27 18 -19 19 -48 22 -449 l3 -429 201 2 201 3 5 406 c5 472 3 488 -73 565 -29 29 -53 44 -70 44 -14 0 -25 -4 -25 -10 0 -5 8 -10 17 -10 26 0 97 -82 113 -130 11 -36 14 -118 11 -425 -1 -209 -4 -388 -7 -397 -5 -16 -22 -18 -175 -18 l-169 0 0 218 c-1 610 -2 620 -61 665 -27 19 -88 25 -128 12 -38 -12 -41 -41 -41 -474 l0 -418 -278 -6 c-344 -8 -399 -1 -508 69 -54 34 -77 61 -114 134 -50 97 -50 106 -50 740 0 327 2 604 4 615 37 180 141 284 326 324 82 17 894 12 975 -6 118 -27 187 -90 222 -201 27 -87 26 -415 -2 -491 -20 -54 -85 -131 -112 -131 -7 0 -17 -9 -23 -20 -11 -20 -10 -20 27 -5 52 22 101 71 125 125 43 100 45 421 3 545 -23 66 -64 121 -117 157 -82 54 -105 56 -583 60 -242 2 -465 0 -496 -4z" />
          <path d="M1055 2190 c-41 -17 -66 -56 -76 -121 -5 -37 -8 -285 -7 -584 3 -471 5 -523 20 -552 44 -79 115 -96 171 -39 19 19 37 47 40 62 10 48 6 1154 -3 1180 -18 47 -94 76 -145 54z m103 -36 l22 -14 0 -591 c0 -657 2 -637 -66 -659 -32 -11 -39 -10 -63 7 -49 37 -50 49 -50 638 -1 504 0 553 17 585 29 58 81 70 140 34z" />
          <path d="M1610 2173 c-12 -14 -15 -54 -15 -215 0 -185 1 -198 20 -212 41 -31 135 -13 181 35 l29 30 0 142 c0 158 -9 193 -54 220 -39 23 -140 23 -161 0z m151 -24 c32 -17 39 -52 39 -193 0 -119 -2 -136 -20 -159 -20 -25 -31 -29 -122 -41 l-38 -5 0 211 0 211 60 -6 c34 -4 70 -12 81 -18z" />
        </g>
      </svg>
      OR Store
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
          <Link href="/upload" className="text-sm font-medium hover:text-primary">
            Add Transaction
          </Link>
          {!isUserLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {user.email}
                  </span>
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
