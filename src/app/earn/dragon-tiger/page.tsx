
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, limit, serverTimestamp, increment } from 'firebase/firestore';
import { ChevronLeft, Zap, Loader2, IndianRupee, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const ROUND_TIME = 60;

function PlayingCard({ value, suit, label, colorClass }: { value: number | string, suit: string, label: string, colorClass: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 animate-in zoom-in duration-500")}>
      <p className={cn("text-xs font-black uppercase tracking-widest", colorClass)}>{label}</p>
      <div className="w-24 h-36 bg-white rounded-xl shadow-2xl flex flex-col items-center justify-between p-3 border-4 border-white/10 relative overflow-hidden group">
        <div className="absolute top-1 left-2 text-black font-black text-lg leading-none">{value}</div>
        <div className="text-4xl">{suit}</div>
        <div className="absolute bottom-1 right-2 text-black font-black text-lg rotate-180 leading-none">{value}</div>
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
           <div className="text-6xl font-black text-black uppercase">Battle</div>
        </div>
      </div>
    </div>
  );
}

export default function DragonTigerPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [selectedChip, setSelectedChip] = useState(10);
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  
  const [lastResult, setLastResult] = useState<{ dragon: number, tiger: number, winner: string } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const revealedPeriod = useRef<string | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const resultsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'dragon_tiger_results'), orderBy('period', 'desc'), limit(20));
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

  // Handle Reveal Animation
  useEffect(() => {
    if (!recentResults || recentResults.length === 0) return;
    const latest = recentResults[0];
    const prevPeriod = generatePeriod(new Date(Date.now() - (ROUND_TIME * 1000)));

    if (latest.period === prevPeriod && revealedPeriod.current !== latest.period) {
      revealedPeriod.current = latest.period;
      setLastResult({
        dragon: latest.dragonCard,
        tiger: latest.tigerCard,
        winner: latest.winner
      });
      setIsRevealing(true);
      setTimeout(() => setIsRevealing(false), 8000);
    }
  }, [recentResults, generatePeriod]);

  const handleBet = (type: string) => {
    if (!user || !db || !userDocRef) {
      toast({ variant: 'destructive', title: 'Sign In Required' });
      return;
    }
    if (timeLeft <= 5) {
      toast({ variant: 'destructive', title: 'Betting Closed' });
      return;
    }

    if ((profile?.balance || 0) < selectedChip) {
      toast({ variant: 'destructive', title: 'Insufficient balance' });
      return;
    }

    setIsPlacingBet(true);
    
    // Update balance and REDUCE required wager
    const currentWager = profile?.requiredWager || 0;
    const reduction = Math.min(currentWager, selectedChip);

    updateDocumentNonBlocking(userDocRef, {
      balance: increment(-selectedChip),
      requiredWager: increment(-reduction)
    });

    addDocumentNonBlocking(collection(db, 'bets'), {
      userId: user.uid,
      period: currentPeriod,
      gameType: 'dragon_tiger',
      betType: type,
      amount: selectedChip,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    addDocumentNonBlocking(collection(db, 'transactions'), {
      userId: user.uid,
      type: 'bet',
      amount: selectedChip,
      description: `Bet on ${type} in Dragon Tiger for period ${currentPeriod}`,
      timestamp: serverTimestamp()
    });

    toast({ title: 'Bet Successful', description: `₹${selectedChip.toFixed(2)} on ${type}. Wage requirement updated.` });
    setIsPlacingBet(false);
  };

  const getCardValue = (val: number) => {
    if (val === 1) return 'A';
    if (val === 11) return 'J';
    if (val === 12) return 'Q';
    if (val === 13) return 'K';
    return val.toString();
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
             <span className="text-xs font-bold">₹{Number(profile?.balance || 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
             <Zap className={cn("w-3 h-3 fill-yellow-500", timeLeft <= 5 && "animate-pulse text-red-500")} />
             <span className={cn("text-xs font-bold font-mono", timeLeft <= 5 && "text-red-500")}>00:{timeLeft.toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <div className="relative aspect-video bg-gradient-to-b from-[#111] to-[#050505] rounded-[2.5rem] mb-12 flex flex-col items-center justify-center overflow-hidden border border-white/5 shadow-2xl">
         {isRevealing && lastResult ? (
           <div className="flex items-center gap-12 z-10">
              <PlayingCard value={getCardValue(lastResult.dragon)} suit="♠️" label="Dragon" colorClass="text-red-500" />
              <div className="flex flex-col items-center">
                 <div className="text-2xl font-black italic text-white/20 mb-2">VS</div>
                 <div className={cn(
                   "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                   lastResult.winner === 'Dragon' ? "bg-red-500 text-white" :
                   lastResult.winner === 'Tiger' ? "bg-blue-500 text-white" :
                   "bg-green-500 text-white"
                 )}>
                   {lastResult.winner} WINS
                 </div>
              </div>
              <PlayingCard value={getCardValue(lastResult.tiger)} suit="♥️" label="Tiger" colorClass="text-blue-500" />
           </div>
         ) : (
           <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                <Zap className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">
                {timeLeft <= 5 ? "Result Generating..." : "Waiting for Battle..."}
              </p>
           </div>
         )}
         
         {timeLeft <= 5 && !isRevealing && (
           <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
             <p className="text-2xl font-black text-red-500 uppercase tracking-widest italic animate-bounce">Locked</p>
           </div>
         )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-12">
        <button 
          onClick={() => handleBet('Dragon')}
          className="aspect-[4/5] bg-gradient-to-b from-[#ff1744] to-[#b71c1c] rounded-[2.5rem] p-4 flex flex-col items-center justify-center shadow-xl hover:scale-95 transition-transform active:scale-90 disabled:opacity-50"
          disabled={timeLeft <= 5}
        >
          <span className="text-xl font-black italic mb-1">DRAGON</span>
          <span className="text-[10px] font-bold opacity-60">1.90x</span>
        </button>

        <button 
          onClick={() => handleBet('Tie')}
          className="aspect-[4/5] bg-[#111] border-2 border-green-500/20 rounded-[2.5rem] p-4 flex flex-col items-center justify-center shadow-xl hover:scale-95 transition-transform active:scale-90 disabled:opacity-50"
          disabled={timeLeft <= 5}
        >
          <span className="text-xl font-black italic text-[#00e676] mb-1">TIE</span>
          <span className="text-[10px] font-bold text-white/40">9.00x</span>
        </button>

        <button 
          onClick={() => handleBet('Tiger')}
          className="aspect-[4/5] bg-gradient-to-b from-[#2979ff] to-[#0d47a1] rounded-[2.5rem] p-4 flex flex-col items-center justify-center shadow-xl hover:scale-95 transition-transform active:scale-90 disabled:opacity-50"
          disabled={timeLeft <= 5}
        >
          <span className="text-xl font-black italic mb-1">TIGER</span>
          <span className="text-[10px] font-bold opacity-60">1.90x</span>
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
                  : "bg-white/5 text-white/40"
              )}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <History className="w-4 h-4 text-white/40" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Battle History</h3>
        </div>
        <div className="bg-[#111] rounded-[2rem] overflow-hidden border border-white/5">
          <table className="w-full text-center text-xs">
            <thead className="bg-white/5">
              <tr className="h-10 text-white/20 uppercase font-black">
                <th className="px-4">Period</th>
                <th className="px-4">Winner</th>
                <th className="px-4">Cards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentResults?.map((res) => (
                <tr key={res.id} className="h-12">
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
