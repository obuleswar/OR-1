
'use client';

import { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { ChevronLeft, IndianRupee, History, Trophy, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { placeK3Bet, settleK3Round } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ROUND_TIME = 60;

function DiceFace({ value, className }: { value: number; className?: string }) {
  const dots: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  return (
    <div className={cn("w-16 h-16 bg-red-600 rounded-xl relative shadow-inner p-2 grid grid-cols-3 gap-1 border-2 border-red-700/50", className)}>
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {dots[value]?.includes(i) && (
            <div className={cn("w-2.5 h-2.5 rounded-full bg-white shadow-sm", value === 1 && "w-4 h-4 bg-yellow-400")} />
          )}
        </div>
      ))}
    </div>
  );
}

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

  const [animatingDice, setAnimatingDice] = useState([1, 1, 1]);
  const [isDiceAnimating, setIsDiceAnimating] = useState(false);

  const lastSettledPeriod = useRef<string | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const resultsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'k3_results'), orderBy('createdAt', 'desc'), limit(20));
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
    if (recentResults && recentResults.length > 0 && !isDiceAnimating) {
      const latest = recentResults[0];
      if (latest.dice) {
        setAnimatingDice(latest.dice);
      }
    }
  }, [recentResults, isDiceAnimating]);

  useEffect(() => {
    if (!isInitialized || !currentPeriod) return;

    const now = new Date();
    const prevRoundTime = new Date(now.getTime() - (ROUND_TIME * 1000));
    const prevPeriod = generatePeriod(prevRoundTime);

    if (lastSettledPeriod.current !== prevPeriod) {
      lastSettledPeriod.current = prevPeriod;
      startTransition(() => {
        setIsDiceAnimating(true);
        const interval = setInterval(() => {
          setAnimatingDice([
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
          ]);
        }, 100);

        settleK3Round(prevPeriod).then((res) => {
          clearInterval(interval);
          if (res.success && res.result) {
            setAnimatingDice(res.result.dice);
          }
          setIsDiceAnimating(false);
        });
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
    <div className="container mx-auto px-0 max-w-lg min-h-screen bg-[#070123] text-white pb-24 font-body overflow-x-hidden">
      <div className="flex items-center justify-between p-4 bg-[#0a043c] border-b border-white/5">
        <Link href="/earn">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold italic tracking-wider">K3 Lotre</h1>
        <Info className="h-6 w-6 text-white/60" />
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="bg-white/5 rounded-full px-4 py-1 flex items-center gap-2 border border-white/10">
            <span className="text-sm font-bold tracking-tight">{currentPeriod}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="bg-[#111] w-8 h-10 rounded-md flex items-center justify-center text-xl font-black text-blue-400 border border-white/10">{timerParts.s1}</div>
            <div className="bg-[#111] w-8 h-10 rounded-md flex items-center justify-center text-xl font-black text-blue-400 border border-white/10">{timerParts.s2}</div>
          </div>
        </div>

        <div className="relative bg-[#00c99e] p-6 rounded-[2rem] border-4 border-[#009c7a] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex justify-center gap-4 py-4 bg-black/20 rounded-2xl border border-black/10">
            {animatingDice.map((val, idx) => (
              <DiceFace key={idx} value={val} className={isDiceAnimating ? "animate-bounce" : ""} />
            ))}
          </div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-8 bg-[#009c7a] rounded-r-lg" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-8 bg-[#009c7a] rounded-l-lg" />
        </div>

        <Tabs defaultValue="total" className="w-full">
          <TabsList className="grid grid-cols-4 bg-[#1a144e] p-1 rounded-xl h-12">
            <TabsTrigger value="total" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#00c99e]">Total</TabsTrigger>
            <TabsTrigger value="2same" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#00c99e]">2 same</TabsTrigger>
            <TabsTrigger value="3same" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#00c99e]">3 same</TabsTrigger>
            <TabsTrigger value="diff" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#00c99e]">Different</TabsTrigger>
          </TabsList>
          
          <TabsContent value="total" className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleBet('Small')} className="h-20 bg-[#2979ff] rounded-2xl font-black text-sm italic shadow-lg active:scale-95 flex flex-col items-center justify-center">
                  <span>SMALL</span>
                  <span className="text-[10px] opacity-60">2X</span>
                </button>
                <button onClick={() => handleBet('Big')} className="h-20 bg-[#ff9100] rounded-2xl font-black text-sm italic shadow-lg active:scale-95 flex flex-col items-center justify-center">
                  <span>BIG</span>
                  <span className="text-[10px] opacity-60">2X</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleBet('Even')} className="h-20 bg-[#00e676] rounded-2xl font-black text-sm italic shadow-lg active:scale-95 flex flex-col items-center justify-center">
                  <span>EVEN</span>
                  <span className="text-[10px] opacity-60">2X</span>
                </button>
                <button onClick={() => handleBet('Odd')} className="h-20 bg-[#ff1744] rounded-2xl font-black text-sm italic shadow-lg active:scale-95 flex flex-col items-center justify-center">
                  <span>ODD</span>
                  <span className="text-[10px] opacity-60">2X</span>
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="bg-black/40 p-3 rounded-full border border-white/5 mt-4">
          <div className="flex justify-between items-center px-1">
            {[1, 5, 10, 20, 50, 100].map((val) => (
              <button
                key={val}
                onClick={() => setSelectedChip(val)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                  selectedChip === val 
                    ? "bg-[#00c99e] text-white scale-110 shadow-[0_0_15px_rgba(0,201,158,0.5)] border-2 border-white/20" 
                    : "bg-white/5 text-white/30"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <div className="bg-black/40 px-6 py-2 rounded-full flex items-center gap-3 border border-white/5">
            <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
              <IndianRupee className="w-3 h-3 text-black" />
            </div>
            <span className="font-bold">₹{profile?.balance?.toLocaleString() || '0.00'}</span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex gap-2">
            <Button variant="ghost" className="bg-[#00c99e] text-white rounded-lg h-10 px-6 text-sm font-bold">Game history</Button>
            <Button variant="ghost" className="bg-white/5 text-white/60 rounded-lg h-10 px-6 text-sm font-bold">Chart</Button>
            <Button variant="ghost" className="bg-white/5 text-white/60 rounded-lg h-10 px-6 text-sm font-bold">My history</Button>
          </div>

          <div className="bg-[#1a144e] rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-center text-sm">
              <thead className="bg-black/20">
                <tr className="h-12 text-white/40 uppercase text-[10px] font-black tracking-widest">
                  <th className="px-4">Period</th>
                  <th className="px-4">Sum</th>
                  <th className="px-4">Results</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentResults?.map((res) => (
                  <tr key={res.id} className="h-14 hover:bg-white/5 transition-colors">
                    <td className="font-mono text-xs opacity-60">{res.period}</td>
                    <td className="font-bold text-lg text-blue-400">{res.sum}</td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", res.bs === 'Big' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500')}>{res.bs}</span>
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", res.oe === 'Even' ? 'bg-green-500/20 text-green-500' : 'bg-pink-500/20 text-pink-500')}>{res.oe}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isPlacingBet && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 animate-spin text-[#00c99e]" />
        </div>
      )}

      {timeLeft <= 5 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 backdrop-blur-sm pointer-events-none">
          <p className="text-4xl font-black text-red-500 uppercase tracking-[0.2em] italic -rotate-12 border-4 border-red-500 px-8 py-2 rounded-2xl">Locked</p>
        </div>
      )}
    </div>
  );
}
