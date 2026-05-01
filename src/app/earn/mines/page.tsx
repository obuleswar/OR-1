
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { ChevronLeft, IndianRupee, Bomb, Gem, Loader2, Zap, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getMinesMultiplier } from '@/lib/mines-logic';

export default function MinesPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState(10);
  const [bombCount, setBombCount] = useState(3);
  
  const [activeGame, setActiveGame] = useState<any>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'active' | 'won' | 'lost'>('idle');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const handleStartGame = () => {
    if (!user || !db || !userDocRef) return toast({ variant: 'destructive', title: 'Sign in required' });
    if ((profile?.balance || 0) < betAmount) return toast({ variant: 'destructive', title: 'Insufficient balance' });

    setIsActionLoading(true);
    
    // Generate bomb positions (0-24)
    const bombs: number[] = [];
    while (bombs.length < bombCount) {
      const pos = Math.floor(Math.random() * 25);
      if (!bombs.includes(pos)) bombs.push(pos);
    }

    const gameId = Math.random().toString(36).substring(7);
    const gameData = {
      id: gameId,
      userId: user.uid,
      betAmount,
      bombCount,
      revealedIndices: [],
      bombPositions: bombs,
      status: 'active',
      payout: 0,
      createdAt: new Date().toISOString()
    };

    updateDocumentNonBlocking(userDocRef, {
      balance: increment(-betAmount)
    });

    addDocumentNonBlocking(collection(db, 'transactions'), {
      userId: user.uid,
      type: 'bet',
      amount: betAmount,
      description: `Mines Game Start (${bombCount} Bombs)`,
      timestamp: serverTimestamp()
    });

    // In a prototype, we can keep the sensitive game state in local state
    // and sync to firestore for record keeping.
    setActiveGame(gameData);
    setGameStatus('active');
    
    addDocumentNonBlocking(collection(db, 'mines_games'), gameData);

    setIsActionLoading(false);
  };

  const handleReveal = (index: number) => {
    if (gameStatus !== 'active' || isActionLoading || activeGame.revealedIndices.includes(index)) return;

    const isBomb = activeGame.bombPositions.includes(index);
    const newRevealed = [...activeGame.revealedIndices, index];

    if (isBomb) {
      setGameStatus('lost');
      setActiveGame({ ...activeGame, revealedIndices: newRevealed, status: 'lost' });
      toast({ variant: 'destructive', title: 'BOOM!', description: 'You hit a mine.' });
    } else {
      setActiveGame({ ...activeGame, revealedIndices: newRevealed });
    }
  };

  const handleCashOut = () => {
    if (gameStatus !== 'active' || !activeGame || activeGame.revealedIndices.length === 0 || !userDocRef) return;

    setIsActionLoading(true);
    const multiplier = getMinesMultiplier(activeGame.bombCount, activeGame.revealedIndices.length);
    const payout = Math.floor(activeGame.betAmount * multiplier);

    updateDocumentNonBlocking(userDocRef, {
      balance: increment(payout),
      totalEarning: increment(payout - activeGame.betAmount)
    });

    addDocumentNonBlocking(collection(db, 'transactions'), {
      userId: user!.uid,
      type: 'win',
      amount: payout,
      description: `Mines Cash Out (${activeGame.revealedIndices.length} Gems)`,
      timestamp: serverTimestamp()
    });

    setGameStatus('won');
    toast({ title: 'Cashed Out!', description: `Won ₹${payout.toFixed(2)}` });
    setIsActionLoading(false);
  };

  const currentMultiplier = activeGame ? getMinesMultiplier(activeGame.bombCount, activeGame.revealedIndices.length) : 1;
  const potentialWin = activeGame ? Math.floor(activeGame.betAmount * currentMultiplier) : 0;

  return (
    <div className="container mx-auto px-4 py-4 max-w-lg min-h-screen bg-[#050505] text-white pb-24 font-body">
      <div className="flex items-center justify-between mb-8">
        <Link href="/earn">
          <Button variant="ghost" size="icon" className="text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
           <h1 className="text-2xl font-black tracking-tighter italic text-blue-500">MINES</h1>
           <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Provably Fair</p>
        </div>
        <div className="bg-[#1a1a1a] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/5">
           <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
             <IndianRupee className="w-2.5 h-2.5 text-black" />
           </div>
           <span className="text-xs font-bold">₹{Number(profile?.balance || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#111] p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Multiplier</p>
          <p className="text-2xl font-black text-blue-400">x{currentMultiplier.toFixed(2)}</p>
          <Zap className="absolute -right-2 -bottom-2 w-12 h-12 text-blue-500/10" />
        </div>
        <div className="bg-[#111] p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Current Win</p>
          <p className="text-2xl font-black text-green-400">₹{potentialWin.toFixed(2)}</p>
          <Trophy className="absolute -right-2 -bottom-2 w-12 h-12 text-green-500/10" />
        </div>
      </div>

      <div className="bg-[#0a0a0a] aspect-square grid grid-cols-5 gap-3 p-4 rounded-[2rem] border border-white/5 shadow-2xl mb-8">
        {Array.from({ length: 25 }).map((_, i) => {
          const isRevealed = activeGame?.revealedIndices.includes(i);
          const isBomb = activeGame?.bombPositions.includes(i);
          const showAsBomb = (gameStatus !== 'active' && gameStatus !== 'idle' && isBomb);
          const showAsGem = (isRevealed && !isBomb) || (gameStatus === 'won' && !isBomb);

          return (
            <button
              key={i}
              onClick={() => handleReveal(i)}
              disabled={gameStatus !== 'active' || isRevealed || isActionLoading}
              className={cn(
                "aspect-square rounded-xl flex items-center justify-center transition-all transform active:scale-90",
                isRevealed || gameStatus !== 'active' ? "cursor-default" : "hover:bg-white/10",
                showAsBomb ? "bg-red-500/20 border border-red-500/40" : 
                showAsGem ? "bg-green-500/20 border border-green-500/40" : 
                "bg-[#1a1a1a] border border-white/5"
              )}
            >
              {showAsBomb ? (
                <Bomb className="w-6 h-6 text-red-500 fill-red-500" />
              ) : showAsGem ? (
                <Gem className="w-6 h-6 text-green-400 fill-green-400" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-[#111] p-6 rounded-[2.5rem] border border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select Mines</p>
          <div className="bg-red-500/10 border border-red-500/20 px-3 py-0.5 rounded-full">
            <span className="text-[10px] font-black text-red-500 uppercase">{bombCount} Bombs</span>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          {[1, 3, 5, 10, 24].map((n) => (
            <button
              key={n}
              onClick={() => setBombCount(n)}
              disabled={gameStatus === 'active'}
              className={cn(
                "flex-1 h-12 rounded-xl font-black text-sm transition-all border",
                bombCount === n 
                  ? "bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                  : "bg-white/5 border-white/5 text-white/40"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-xl border border-white/5 p-1 flex overflow-x-auto">
              {[1, 5, 10, 20, 50, 100].map(amt => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  disabled={gameStatus === 'active'}
                  className={cn(
                    "flex-1 h-10 min-w-[45px] rounded-lg text-[10px] font-bold transition-all",
                    betAmount === amt ? "bg-white/10 text-white" : "text-white/40"
                  )}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {gameStatus === 'active' ? (
            <Button 
              onClick={handleCashOut}
              disabled={activeGame?.revealedIndices.length === 0 || isActionLoading}
              className="w-full h-16 bg-green-500 hover:bg-green-600 text-white font-black text-lg rounded-2xl shadow-lg"
            >
              {isActionLoading ? <Loader2 className="animate-spin" /> : `CASH OUT ₹${potentialWin.toFixed(2)}`}
            </Button>
          ) : (
            <Button 
              onClick={handleStartGame}
              disabled={isActionLoading}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-lg"
            >
              {isActionLoading ? <Loader2 className="animate-spin" /> : "BET"}
            </Button>
          )}
        </div>
      </div>

      {gameStatus !== 'active' && gameStatus !== 'idle' && (
        <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-4">
          <p className={cn(
            "text-sm font-black uppercase tracking-[0.2em]",
            gameStatus === 'won' ? "text-green-500" : "text-red-500"
          )}>
            {gameStatus === 'won' ? "Game Won!" : "Game Over"}
          </p>
          <Button 
            variant="link" 
            onClick={() => { setGameStatus('idle'); setActiveGame(null); }}
            className="text-white/40 text-xs mt-2"
          >
            Play Again
          </Button>
        </div>
      )}
    </div>
  );
}
