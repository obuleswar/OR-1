'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { ChevronLeft, IndianRupee, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { placeK3Bet } from './actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ROUND_TIME = 60;

function DiceFace({ value, className }: { value: number; className?: string }) {
  const dots: Record<number, number[]> = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
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
  
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [selectedChip, setSelectedChip] = useState(10);
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const [animatingDice, setAnimatingDice] = useState([1, 1, 1]);
  const [isDiceAnimating, setIsDiceAnimating] = useState(false);
  const revealedPeriod = useRef<string | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const resultsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'k3_results'), orderBy('period', 'desc'), limit(20));
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

  // Dice Animation sync with recent results
  useEffect(() => {
    if (!recentResults || recentResults.length === 0) return;
    const latest = recentResults[0];
    const prevPeriod = generatePeriod(new Date(Date.now() - (ROUND_TIME * 1000)));

    if (latest.period === prevPeriod && revealedPeriod.current !== latest.period) {
      revealedPeriod.current = latest.period;
      setIsDiceAnimating(true);
      const interval = setInterval(() => {
        setAnimatingDice([Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1]);
      }, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        setAnimatingDice(latest.dice);
        setIsDiceAnimating(false);
      }, 3000);
    } else if (!isDiceAnimating && latest.dice) {
      setAnimatingDice(latest.dice);
    }
  }, [recentResults, isDiceAnimating, generatePeriod]);

  // Sync Timer
  useEffect(() => {
    if (!isInitialized) return;
    const timer = setInterval(() => {
      const now = new Date();
      const period = generatePeriod();
      const secondsInRound = (now.getUTCSeconds() + (now.getUTCMinutes() * 60)) % ROUND_TIME;
      const remaining = ROUND_TIME - secondsInRound;
      setTimeLeft(remaining);
      if (period !== currentPeriod) setCurrentPeriod(period);
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
            <div className="bg-[#111] w-8 h-10 rounded-md flex items-center justify-center text-xl font-black text-blue-400">0</div>
            <div className="bg-[#111] w-8 h-10 rounded-md flex items-center justify-center text-xl font-black text-blue-400">{timeLeft.toString().padStart(2, '0')}</div>
          </div>
        </div>

        <div className="relative bg-[#00c99e] p-6 rounded-[2rem] border-4 border-[#009c7a] shadow-xl">
          <div className="flex justify-center gap-4 py-4 bg-black/20 rounded-2xl">
            {animatingDice.map((val, idx) => (
              <DiceFace key={idx} value={val} className={isDiceAnimating ? "animate-bounce" : ""} />
            ))}
          </div>
        </div>

        <Tabs defaultValue="total" className="w-full">
          <TabsList className="grid grid-cols-4 bg-[#1a144e] p-1 rounded-xl h-12">
            <TabsTrigger value="total" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#00c99e]">Total</TabsTrigger>
          </TabsList>
          
          <TabsContent value="total" className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleBet('Small')} className="h-20 bg-[#2979ff] rounded-2xl font-black text-sm italic">SMALL</button>
                <button onClick={() => handleBet('Big')} className="h-20 bg-[#ff9100] rounded-2xl font-black text-sm italic">BIG</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleBet('Even')} className="h-20 bg-[#00e676] rounded-2xl font-black text-sm italic">EVEN</button>
                <button onClick={() => handleBet('Odd')} className="h-20 bg-[#ff1744] rounded-2xl font-black text-sm italic">ODD</button>
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
                  selectedChip === val ? "bg-[#00c99e] text-white scale-110 shadow-lg border-2 border-white/20" : "bg-white/5 text-white/30"
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
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Game History</h3>
          <div className="bg-[#1a144e] rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-center text-sm">
              <thead className="bg-black/20 text-[10px] font-black tracking-widest text-white/40 h-10 uppercase">
                <tr>
                  <th>Period</th>
                  <th>Sum</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentResults?.map((res) => (
                  <tr key={res.id} className="h-12">
                    <td className="font-mono text-xs opacity-60">{res.period}</td>
                    <td className="font-bold text-blue-400">{res.sum}</td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", res.bs === 'Big' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500')}>{res.bs}</span>
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
