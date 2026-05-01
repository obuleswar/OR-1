
'use client';

import Link from 'next/link';
import { ChevronLeft, Gamepad2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const GAMES = [
  {
    id: 'candy-crush',
    title: 'Candy Crush',
    description: 'Match candies to earn rewards',
    icon: '🍬',
    href: '/earn/play-games/candy-crush',
    color: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  {
    id: 'catch-robbo',
    title: 'Catch Robbo',
    description: 'Action packed droid catching',
    icon: '🤖',
    href: '/earn/play-games/catch-robbo',
    color: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  }
];

export default function PlayGamesMenu() {
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg min-h-screen bg-[#050505] text-white pb-24">
      <header className="flex items-center justify-between mb-8">
        <Link href="/earn">
          <Button variant="ghost" size="icon" className="text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
           <h1 className="text-2xl font-black tracking-tighter italic text-primary uppercase">Play Games</h1>
           <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Skill Arcade</p>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="space-y-4">
        {GAMES.map((game) => (
          <Link key={game.id} href={game.href}>
            <Card className={cn(
              "bg-[#111] border transition-all hover:bg-[#161616] mb-4 overflow-hidden rounded-[2rem]",
              game.border
            )}>
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-3xl", game.color)}>
                    {game.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase italic">{game.title}</h3>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-wide">{game.description}</p>
                  </div>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-[#111] p-6 rounded-[2rem] border border-white/5">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">How it works</h4>
        <ul className="space-y-3">
          <li className="flex gap-3 text-xs font-bold text-white/60">
            <span className="text-primary">1.</span>
            <span>Select a game and place your skill-bet.</span>
          </li>
          <li className="flex gap-3 text-xs font-bold text-white/60">
            <span className="text-primary">2.</span>
            <span>Complete a 5-minute session of active play.</span>
          </li>
          <li className="flex gap-3 text-xs font-bold text-white/60">
            <span className="text-primary">3.</span>
            <span>Solve the verification captcha at the end.</span>
          </li>
          <li className="flex gap-3 text-xs font-bold text-white/60">
            <span className="text-primary">4.</span>
            <span>Receive 1.5x of your bet instantly in your wallet!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
