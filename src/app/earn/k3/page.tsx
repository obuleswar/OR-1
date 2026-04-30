
'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ChevronLeft, Zap, Loader2, IndianRupee, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { placeK3Bet, settleK3Round } from './actions';

const ROUND_TIME = 60;

export default function K3LotrePage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [selectedChip, setSelectedChip] = useState(10);
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const lastSettledPeriod = useRef<string | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const generatePeriod = useCallback(() => {
    const now = new Date();
    const yyyymmdd = now.getUTCFullYear().toString() + 
                     (now.getUTCMonth() + 1).toString().padStart(2, '0') + 
                     now.getUTCDate().toString().padStart(2, '0');
    const secondsInDay = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
    const roundNumber = Math.floor(secondsInDay / ROUND_TIME);
    return `${yyyymmdd}${roundNumber.toString().padStart(6, '0')}`;
  }, []);

  useEffect(() => {
    setCurrentPeriod(generatePeriod());
    setIsInitialized(true);
  }, [generatePeriod]);

  useEffect(() => {
    if (!isInitialized || !currentPeriod) return;

    const now = new Date();
    const nowMs = now.getTime();
    const prevRoundTime = new Date(nowMs - (ROUND_TIME * 1000));
    const prevYMD = prevRoundTime.getUTCFullYear().toString() + 
                    (prevRoundTime.getUTCMonth() + 1).toString().padStart(2, '0') + 
                    prevRoundTime.getUTCDate().toString().padStart(2, '0');
    const prevSecs = prevRoundTime.getUTCHours() * 3600 + prevRoundTime.getUTCMinutes() * 60 + prevRoundTime.getUTCSeconds();
    const prevRoundNum = Math.floor(prevSecs / ROUND_TIME);
    const prevPeriod = `${prevYMD}${prevRoundNum.toString().padStart(6, '0')}`;

    if (lastSettledPeriod.current !== prevPeriod) {
      lastSettledPeriod.current = prevPeriod;
      startTransition(() => {
        settleK3Round(prevPeriod);
      });
    }
  }, [currentPeriod, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    const timer = setInterval(() => {
      const now = new Date();
      const period = generatePeriod();
      const secondsInRound = (now.getUTCSeconds() + (now.getUTCMinutes() * 60)) % ROUND_TIME;
      const remaining = ROUND_TIME - secondsInRound;

      setTimeLeft(remaining);
      
      if (period !== currentPeriod) {
        setCurrentPeriod(period);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPeriod, generatePeriod, isInitialized]);

  const handleBet = async (type: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Sign In Required' });
      return;
    }
    if (timeLeft <= 5) {
      toast({ variant: 'destructive', title: 'Betting Closed' });
      return;
    }

    setIsPlacingBet(true);
    const res = await placeK3Bet(user.uid, currentPeriod, type, selectedChip);
    if (res.success) {
      toast({ title: 'Bet Successful', description: `₹${selectedChip} on ${type}` });
    } else {
      toast({ variant: 'destructive', title: 'Bet Failed', description: res.error });
    }
    setIsPlacingBet(false);
  };

  const formatTimer = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return {
      m1: Math.floor(mins / 10),
      m2: mins % 10,
      s1: Math.floor(secs / 10),
      s2: secs % 10
    };
  };

  const timerParts = formatTimer(timeLeft);

  if (!isInitialized) return null;

  return (
    <div className="container mx-auto px-4 py-4 max-w-lg min-h-screen bg-[#070123] text-white pb-24 font-body">
      <div className="flex items-center justify-between mb-8">
        <Link href="/earn">
          <Button variant="ghost" size="icon" className="text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black italic tracking-wider uppercase">K3 Lotre</h1>
        <Button variant="ghost" size="icon" className="text-white">
          <Gamepad2 className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-gradient-to-b from-[#1a144e] to-[#070123] border border-blue-500/40 rounded-xl px-10 py-3 flex flex-col items-center shadow-lg relative overflow-hidden group">
          <Zap className="w-5 h-5 text-blue-400 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">K3 1 MIN</span>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
        </div>
      </div>

      <div className="bg-[#1a144e]/60 rounded-[2rem] p-6 mb-8 border border-white/5 shadow-2xl relative">
        <div className="flex justify-between items-start mb-10">
          <div className="bg-black/40 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
              <IndianRupee className="w-2.5 h-2.5 text-black" />
            </div>
            <span className="text-xs font-bold">₹{profile?.balance?.toLocaleString() || '0.00'}</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Period</p>
            <p className="text-lg font-bold tracking-tight">{currentPeriod}</p>
          </div>
        </div>

        <div className="bg-black/20 rounded-2xl p-4 flex items-center justify-between mb-10 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-300">Counting</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Next Draw In</p>
          <div className="flex items-center gap-2">
            <div className="bg-[#070123] w-12 h-16 rounded-lg flex items-center justify-center text-3xl font-black text-blue-400 border border-white/5">{timerParts.m1}</div>
            <div className="bg-[#070123] w-12 h-16 rounded-lg flex items-center justify-center text-3xl font-black text-blue-400 border border-white/5">{timerParts.m2}</div>
            <span className="text-2xl font-bold text-blue-500 mx-1">:</span>
            <div className="bg-[#070123] w-12 h-16 rounded-lg flex items-center justify-center text-3xl font-black text-blue-400 border border-white/5">{timerParts.s1}</div>
            <div className="bg-[#070123] w-12 h-16 rounded-lg flex items-center justify-center text-3xl font-black text-blue-400 border border-white/5">{timerParts.s2}</div>
          </div>
        </div>

        {timeLeft <= 5 && (
          <div className="absolute inset-0 bg-black/60 rounded-[2rem] flex items-center justify-center z-20 backdrop-blur-sm">
            <p className="text-2xl font-black text-red-500 uppercase tracking-widest italic">Locked</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="space-y-2">
          <button 
            onClick={() => handleBet('Big')}
            className="w-full h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-2xl font-black italic">BIG</span>
          </button>
        </div>

        <div className="space-y-2">
          <button 
            onClick={() => handleBet('Small')}
            className="w-full h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-2xl font-black italic">SMALL</span>
          </button>
        </div>

        <div className="space-y-2">
          <button 
            onClick={() => handleBet('Odd')}
            className="w-full h-20 bg-gradient-to-br from-pink-500 to-pink-700 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-2xl font-black italic">ODD</span>
          </button>
        </div>

        <div className="space-y-2">
          <button 
            onClick={() => handleBet('Even')}
            className="w-full h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-2xl font-black italic">EVEN</span>
          </button>
        </div>
      </div>

      <div className="bg-black/40 p-5 rounded-full border border-white/5 shadow-inner">
        <div className="flex justify-between items-center">
          {[1, 5, 10, 20, 50, 100].map((val) => (
            <button
              key={val}
              onClick={() => setSelectedChip(val)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all relative",
                selectedChip === val 
                  ? "bg-blue-500 text-white scale-125 shadow-[0_0_20px_rgba(59,130,246,0.6)] z-10 border-2 border-white/20" 
                  : "bg-white/5 text-white/30"
              )}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {isPlacingBet && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}
    </div>
  );
}
