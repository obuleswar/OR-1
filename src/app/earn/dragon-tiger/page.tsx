
'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { ChevronLeft, Zap, Loader2, IndianRupee, History, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { placeDragonTigerBet, settleDragonTigerRound } from './actions';

const ROUND_TIME = 60;

export default function DragonTigerPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [selectedChip, setSelectedChip] = useState(1);
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const lastSettledPeriod = useRef<string | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const resultsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'dragon_tiger_results'), orderBy('createdAt', 'desc'), limit(20));
  }, [db]);

  const { data: recentResults } = useCollection(resultsQuery);

  const generatePeriod = useCallback((date: Date = new Date()) => {
    const yyyymmdd = date.getUTCFullYear().toString() + 
                     (date.getUTCMonth() + 1).toString().padStart(2, '0') + 
                     date.getUTCDate().toString().padStart(2, '0');
    const secondsInDay = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
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
    const prevRoundTime = new Date(now.getTime() - (ROUND_TIME * 1000));
    const prevPeriod = generatePeriod(prevRoundTime);

    if (lastSettledPeriod.current !== prevPeriod) {
      lastSettledPeriod.current = prevPeriod;
      startTransition(() => {
        settleDragonTigerRound(prevPeriod);
      });
    }
  }, [currentPeriod, isInitialized, generatePeriod]);

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
    const res = await placeDragonTigerBet(user.uid, currentPeriod, type, selectedChip);
    if (res.success) {
      toast({ title: 'Bet Successful', description: `₹${selectedChip} on ${type}` });
    } else {
      toast({ variant: 'destructive', title: 'Bet Failed', description: res.error });
    }
    setIsPlacingBet(false);
  };

  if (!isInitialized) return null;

  return (
    <div className="container mx-auto px-4 py-4 max-w-lg min-h-screen bg-[#050505] text-white pb-24 font-body">
      <div className="flex items-center justify-between mb-8">
        <Link href="/earn">
          <Button variant="ghost" size="icon" className="text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
           <h1 className="text-2xl font-black tracking-tighter italic">
             <span className="text-[#ff1744]">DRAGON</span>
             <span className="text-[#2979ff] ml-1">TIGER</span>
           </h1>
           <p className="text-[10px] text-white/40 font-mono mt-1">{currentPeriod}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="bg-[#1a1a1a] px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/5">
             <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
               <IndianRupee className="w-2.5 h-2.5 text-black" />
             </div>
             <span className="text-xs font-bold">₹{profile?.balance?.toLocaleString() || '0.00'}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
             <Zap className="w-3 h-3 fill-yellow-500" />
             <span className="text-xs font-bold font-mono">00:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <div className="relative aspect-video bg-gradient-to-b from-[#111] to-[#050505] rounded-3xl mb-12 flex flex-col items-center justify-center overflow-hidden border border-white/5 shadow-2xl">
         <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100">
               <path d="M0 50 Q 50 0 100 50 T 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </svg>
         </div>
         <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
               <svg className="w-8 h-8 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
               </svg>
            </div>
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">Preparing Battle...</p>
         </div>
         {timeLeft <= 5 && (
           <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
             <p className="text-2xl font-black text-red-500 uppercase tracking-widest italic">Locked</p>
           </div>
         )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-12">
        <button 
          onClick={() => handleBet('Dragon')}
          className="aspect-[4/5] bg-gradient-to-b from-[#ff1744] to-[#b71c1c] rounded-[2.5rem] p-4 flex flex-col items-center justify-center shadow-xl hover:scale-95 transition-transform active:scale-90"
        >
          <span className="text-xl font-black italic mb-1">DRAGON</span>
          <span className="text-[10px] font-bold opacity-60">1.90</span>
        </button>

        <button 
          onClick={() => handleBet('Tie')}
          className="aspect-[4/5] bg-[#111] border-2 border-green-500/20 rounded-[2.5rem] p-4 flex flex-col items-center justify-center shadow-xl hover:scale-95 transition-transform active:scale-90"
        >
          <span className="text-xl font-black italic text-[#00e676] mb-1">TIE</span>
          <span className="text-[10px] font-bold text-white/40">9.0</span>
        </button>

        <button 
          onClick={() => handleBet('Tiger')}
          className="aspect-[4/5] bg-gradient-to-b from-[#2979ff] to-[#0d47a1] rounded-[2.5rem] p-4 flex flex-col items-center justify-center shadow-xl hover:scale-95 transition-transform active:scale-90"
        >
          <span className="text-xl font-black italic mb-1">TIGER</span>
          <span className="text-[10px] font-bold opacity-60">1.90</span>
        </button>
      </div>

      <div className="bg-[#111]/50 p-4 rounded-full border border-white/5 shadow-inner mb-12">
        <div className="flex justify-between items-center px-2">
          {[1, 5, 10, 20, 50, 100].map((val) => (
            <button
              key={val}
              onClick={() => setSelectedChip(val)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all relative",
                selectedChip === val 
                  ? "bg-yellow-500 text-black scale-125 shadow-[0_0_20px_rgba(234,179,8,0.5)] z-10" 
                  : "bg-white/10 text-white/40"
              )}
            >
              {val}
              {selectedChip === val && (
                <div className="absolute -inset-1 rounded-full border-2 border-yellow-500/30 animate-ping pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-white/40" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Recent Battle History</h3>
          </div>
          {isPending && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        </div>
        <div className="bg-[#111] rounded-[2rem] overflow-hidden border border-white/5">
          <table className="w-full text-center text-xs">
            <thead className="bg-white/5">
              <tr className="h-10 text-white/20 uppercase font-black">
                <th className="px-4">Period</th>
                <th className="px-4">Winner</th>
                <th className="px-4">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentResults?.map((res) => (
                <tr key={res.id} className="h-12 hover:bg-white/5 transition-colors">
                  <td className="font-mono text-[10px] opacity-40">{res.period}</td>
                  <td>
                    <span className={cn(
                      "px-2 py-0.5 rounded-[4px] font-black text-[10px] uppercase",
                      res.winner === 'Dragon' ? "bg-red-500/20 text-red-500" :
                      res.winner === 'Tiger' ? "bg-blue-500/20 text-blue-500" :
                      "bg-green-500/20 text-green-500"
                    )}>
                      {res.winner}
                    </span>
                  </td>
                  <td className="font-bold text-white/60">
                    {res.dragonCard} : {res.tigerCard}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isPlacingBet && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
