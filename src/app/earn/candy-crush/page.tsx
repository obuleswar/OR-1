
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { ChevronLeft, IndianRupee, Loader2, Zap, Trophy, Heart, Star, Cloud, Moon, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 7;
const GAME_TIME = 60;
const CANDY_TYPES = [
  { icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
  { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { icon: Cloud, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { icon: Moon, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { icon: Ghost, color: 'text-green-400', bg: 'bg-green-400/10' },
];

export default function CandyCrushPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [grid, setGrid] = useState<number[]>([]);
  const [betAmount, setBetAmount] = useState(10);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  // Initialize random grid
  const initGrid = useCallback(() => {
    const newGrid = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => 
      Math.floor(Math.random() * CANDY_TYPES.length)
    );
    setGrid(newGrid);
  }, []);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) {
      if (timeLeft === 0 && gameState === 'playing') {
        handleEndGame();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleStartGame = () => {
    if (!user || !userDocRef) return toast({ variant: 'destructive', title: 'Sign in required' });
    if ((profile?.balance || 0) < betAmount) return toast({ variant: 'destructive', title: 'Insufficient balance' });

    setIsProcessing(true);
    
    updateDocumentNonBlocking(userDocRef, {
      balance: increment(-betAmount)
    });

    addDocumentNonBlocking(collection(db, 'transactions'), {
      userId: user.uid,
      type: 'bet',
      amount: betAmount,
      description: `Candy Crush Bet`,
      timestamp: serverTimestamp()
    });

    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameState('playing');
    setIsProcessing(false);
    initGrid();
  };

  const calculatePayout = (finalScore: number) => {
    if (finalScore >= 2000) return 5;
    if (finalScore >= 1000) return 2.5;
    if (finalScore >= 500) return 1.5;
    return 0;
  };

  const handleEndGame = async () => {
    setGameState('ended');
    const multiplier = calculatePayout(score);
    const payout = Math.floor(betAmount * multiplier);

    if (payout > 0 && userDocRef && db) {
      updateDocumentNonBlocking(userDocRef, {
        balance: increment(payout),
        totalEarning: increment(payout - betAmount)
      });

      addDocumentNonBlocking(collection(db, 'transactions'), {
        userId: user!.uid,
        type: 'win',
        amount: payout,
        description: `Candy Crush Win (Score: ${score})`,
        timestamp: serverTimestamp()
      });

      toast({ 
        title: 'Session Ended!', 
        description: `You scored ${score} and won ₹${payout.toFixed(2)}!` 
      });
    } else {
      toast({ 
        title: 'Session Ended', 
        description: `Score: ${score}. Try again to earn rewards!` 
      });
    }
  };

  const handleSwap = (idx1: number, idx2: number) => {
    const newGrid = [...grid];
    const temp = newGrid[idx1];
    newGrid[idx1] = newGrid[idx2];
    newGrid[idx2] = temp;
    
    // Check if swap creates a match
    if (checkMatches(newGrid)) {
      setGrid(newGrid);
      setTimeout(() => processMatches(newGrid), 300);
    } else {
      toast({ variant: 'destructive', title: 'No match!', description: 'Try another swap.' });
    }
    setSelectedIdx(null);
  };

  const checkMatches = (currentGrid: number[]) => {
    // Horizontal
    for (let i = 0; i < currentGrid.length; i++) {
      if (i % GRID_SIZE < GRID_SIZE - 2) {
        if (currentGrid[i] === currentGrid[i+1] && currentGrid[i] === currentGrid[i+2]) return true;
      }
    }
    // Vertical
    for (let i = 0; i < currentGrid.length - (GRID_SIZE * 2); i++) {
      if (currentGrid[i] === currentGrid[i + GRID_SIZE] && currentGrid[i] === currentGrid[i + (GRID_SIZE * 2)]) return true;
    }
    return false;
  };

  const processMatches = (currentGrid: number[]) => {
    let matchesFound = false;
    const toRemove = new Set<number>();

    // Detect matches
    for (let i = 0; i < currentGrid.length; i++) {
      // Horizontal
      if (i % GRID_SIZE < GRID_SIZE - 2) {
        if (currentGrid[i] === currentGrid[i+1] && currentGrid[i] === currentGrid[i+2]) {
          toRemove.add(i); toRemove.add(i+1); toRemove.add(i+2);
        }
      }
      // Vertical
      if (i < currentGrid.length - (GRID_SIZE * 2)) {
        if (currentGrid[i] === currentGrid[i + GRID_SIZE] && currentGrid[i] === currentGrid[i + (GRID_SIZE * 2)]) {
          toRemove.add(i); toRemove.add(i + GRID_SIZE); toRemove.add(i + (GRID_SIZE * 2));
        }
      }
    }

    if (toRemove.size > 0) {
      matchesFound = true;
      setScore(prev => prev + toRemove.size * 10);
      
      const nextGrid = [...currentGrid];
      toRemove.forEach(idx => nextGrid[idx] = -1); // Mark for removal

      // Gravity & Refill
      for (let c = 0; c < GRID_SIZE; c++) {
        let emptyIdxs = [];
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          const i = r * GRID_SIZE + c;
          if (nextGrid[i] === -1) {
            emptyIdxs.push(i);
          } else if (emptyIdxs.length > 0) {
            const target = emptyIdxs.shift();
            nextGrid[target!] = nextGrid[i];
            nextGrid[i] = -1;
            emptyIdxs.push(i);
          }
        }
        emptyIdxs.forEach(idx => nextGrid[idx] = Math.floor(Math.random() * CANDY_TYPES.length));
      }

      setGrid(nextGrid);
      // Chain matches
      setTimeout(() => processMatches(nextGrid), 400);
    }
  };

  const handleCellClick = (idx: number) => {
    if (gameState !== 'playing') return;

    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else {
      const isAdjacent = 
        idx === selectedIdx - 1 || 
        idx === selectedIdx + 1 || 
        idx === selectedIdx - GRID_SIZE || 
        idx === selectedIdx + GRID_SIZE;

      if (isAdjacent) {
        handleSwap(selectedIdx, idx);
      } else {
        setSelectedIdx(idx);
      }
    }
  };

  const currentMultiplier = calculatePayout(score);

  return (
    <div className="container mx-auto px-4 py-4 max-w-lg min-h-screen bg-[#050505] text-white pb-24 font-body">
      <div className="flex items-center justify-between mb-8">
        <Link href="/earn">
          <Button variant="ghost" size="icon" className="text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
           <h1 className="text-2xl font-black tracking-tighter italic text-yellow-300">CANDY CRUSH</h1>
           <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Skill Reward</p>
        </div>
        <div className="bg-[#1a1a1a] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/5">
           <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
             <IndianRupee className="w-2.5 h-2.5 text-black" />
           </div>
           <span className="text-xs font-bold">₹{Number(profile?.balance || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#111] p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Score</p>
          <p className="text-2xl font-black text-yellow-400">{score}</p>
          <Zap className="absolute -right-2 -bottom-2 w-12 h-12 text-yellow-500/10" />
        </div>
        <div className="bg-[#111] p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Time Left</p>
          <p className={cn("text-2xl font-black", timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-400")}>
            {timeLeft}s
          </p>
          <Trophy className="absolute -right-2 -bottom-2 w-12 h-12 text-blue-500/10" />
        </div>
      </div>

      <div className="relative">
        <div className="bg-[#0a0a0a] aspect-square grid grid-cols-7 gap-1.5 p-3 rounded-[1.5rem] border border-white/10 shadow-2xl mb-8">
          {grid.map((typeIdx, i) => {
            const Candy = CANDY_TYPES[typeIdx].icon;
            const isSelected = selectedIdx === i;

            return (
              <button
                key={i}
                onClick={() => handleCellClick(i)}
                disabled={gameState !== 'playing' || isProcessing}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center transition-all transform active:scale-90",
                  isSelected ? "scale-110 ring-2 ring-white bg-white/10" : "bg-white/5",
                  gameState !== 'playing' && "opacity-50 grayscale"
                )}
              >
                <Candy className={cn("w-6 h-6", CANDY_TYPES[typeIdx].color)} />
              </button>
            );
          })}
        </div>

        {gameState !== 'playing' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-[2px] rounded-[1.5rem]">
            {gameState === 'idle' ? (
              <p className="text-lg font-bold text-white uppercase tracking-widest text-center px-8">
                Place a bet to start 60s session
              </p>
            ) : (
              <div className="text-center">
                <p className="text-3xl font-black text-yellow-300 uppercase italic mb-2">Game Over</p>
                <p className="text-sm font-bold text-white/60 mb-4">Final Score: {score}</p>
                <p className={cn("text-lg font-black", currentMultiplier > 0 ? "text-green-500" : "text-red-500")}>
                  {currentMultiplier > 0 ? `Payout: ${currentMultiplier}x` : "No Reward"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-[#111] p-6 rounded-[2rem] border border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Select Bet</p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-0.5 rounded-full">
            <span className="text-[10px] font-black text-yellow-500 uppercase">Multiplier {currentMultiplier}x</span>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          {[10, 20, 50, 100].map((n) => (
            <button
              key={n}
              onClick={() => setBetAmount(n)}
              disabled={gameState === 'playing'}
              className={cn(
                "flex-1 h-12 rounded-xl font-black text-sm transition-all border",
                betAmount === n 
                  ? "bg-yellow-500 border-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" 
                  : "bg-white/5 border-white/5 text-white/40"
              )}
            >
              ₹{n}
            </button>
          ))}
        </div>

        <Button 
          onClick={handleStartGame}
          disabled={isProcessing || gameState === 'playing'}
          className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-lg"
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : "PLAY NOW"}
        </Button>
      </div>

      <div className="mt-8 space-y-4 px-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Payout Rules</h3>
        <div className="grid grid-cols-3 gap-2">
           <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] text-white/40 font-bold mb-1">500+ PTS</p>
              <p className="text-sm font-black text-green-500">1.5x</p>
           </div>
           <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] text-white/40 font-bold mb-1">1000+ PTS</p>
              <p className="text-sm font-black text-green-500">2.5x</p>
           </div>
           <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] text-white/40 font-bold mb-1">2000+ PTS</p>
              <p className="text-sm font-black text-green-500">5.0x</p>
           </div>
        </div>
      </div>
    </div>
  );
}
