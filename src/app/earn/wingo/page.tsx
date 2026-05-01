
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, writeBatch, serverTimestamp, increment, addDoc } from 'firebase/firestore';
import { IndianRupee, Zap, ChevronLeft, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ROUND_TIME = 60; 

export default function WingoPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [currentPeriod, setCurrentPeriod] = useState('');
  const [isBettingOpen, setIsBettingOpen] = useState(false);
  const [betType, setBetType] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const resultsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'wingo_results'), orderBy('period', 'desc'), limit(20));
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

  const handleBetClick = (type: string) => {
    if (timeLeft <= 5) {
      toast({ variant: 'destructive', title: 'Betting Closed' });
      return;
    }
    setBetType(type);
    setIsBettingOpen(true);
  };

  const onConfirmBet = async () => {
    if (!user || !db) {
      toast({ variant: 'destructive', title: 'Sign In Required' });
      return;
    }
    
    if ((profile?.balance || 0) < selectedAmount) {
      toast({ variant: 'destructive', title: 'Insufficient balance' });
      return;
    }

    setIsPlacingBet(true);
    
    try {
      const batch = writeBatch(db);
      const betRef = doc(collection(db, 'bets'));
      const txnRef = doc(collection(db, 'transactions'));
      const userRef = doc(db, 'users', user.uid);

      batch.set(betRef, {
        userId: user.uid,
        period: currentPeriod,
        gameType: 'wingo',
        betType: betType,
        amount: selectedAmount,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      batch.update(userRef, {
        balance: increment(-selectedAmount)
      });

      batch.set(txnRef, {
        userId: user.uid,
        type: 'bet',
        amount: selectedAmount,
        description: `Bet on ${betType} for period ${currentPeriod}`,
        timestamp: serverTimestamp()
      });

      await batch.commit();
      
      toast({ title: 'Bet Placed', description: `₹${selectedAmount.toFixed(2)} on ${betType}` });
      setIsBettingOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsPlacingBet(false);
    }
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-gradient-to-br from-purple-500 to-red-500';
    if (num === 5) return 'bg-gradient-to-br from-purple-500 to-green-500';
    if ([1, 3, 7, 9].includes(num)) return 'bg-[#00e676]';
    return 'bg-[#ff1744]';
  };

  if (!isInitialized) return null;

  return (
    <div className="container mx-auto px-4 py-4 max-w-lg min-h-screen bg-[#050505] text-white pb-24 font-body">
      <div className="flex items-center justify-between mb-6">
        <Link href="/earn">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/5">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="bg-[#00d2ff]/20 border border-[#00d2ff]/40 px-6 py-2 rounded-xl flex flex-col items-center">
          <Zap className="w-4 h-4 text-[#00d2ff] mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00d2ff]">1 MIN</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-white/60"><History className="h-5 w-5"/></Button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary to-[#ff4b2b] rounded-[2rem] p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
              <div className="bg-yellow-400 rounded-full p-0.5">
                <IndianRupee className="w-3 h-3 text-black" />
              </div>
              <span className="font-bold text-sm">₹{Number(profile?.balance || 0).toFixed(2)}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Time Left</p>
              <div className="bg-black/30 w-10 h-12 rounded-lg flex items-center justify-center text-2xl font-bold text-[#00e676]">{timeLeft.toString().padStart(2, '0')}</div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Period ID</p>
            <p className="text-xl font-bold tracking-tight">{currentPeriod}</p>
          </div>
        </div>
        {timeLeft <= 5 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
            <p className="text-2xl font-bold text-red-500 uppercase tracking-widest">Locked</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Button onClick={() => handleBetClick('Green')} className="h-20 bg-[#00e676] rounded-2xl flex flex-col items-center justify-center">
          <span className="text-lg font-bold">GREEN</span>
          <span className="text-[10px] font-bold opacity-60">1.90x</span>
        </Button>
        <Button onClick={() => handleBetClick('Violet')} className="h-20 bg-[#9c27b0] rounded-2xl flex flex-col items-center justify-center">
          <span className="text-lg font-bold">VIOLET</span>
          <span className="text-[10px] font-bold opacity-60">4.50x</span>
        </Button>
        <Button onClick={() => handleBetClick('Red')} className="h-20 bg-[#ff1744] rounded-2xl flex flex-col items-center justify-center">
          <span className="text-lg font-bold">RED</span>
          <span className="text-[10px] font-bold opacity-60">1.90x</span>
        </Button>
      </div>

      <div className="bg-[#111] rounded-[2rem] p-6 mb-6">
        <div className="grid grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              onClick={() => handleBetClick(num.toString())}
              className={cn("w-14 h-14 rounded-full text-xl font-bold p-0 shadow-lg", getNumberColor(num))}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button onClick={() => handleBetClick('Big')} className="h-20 bg-[#ff9100] rounded-2xl flex flex-col items-center justify-center">
          <span className="text-xl font-black uppercase italic">Big</span>
          <span className="text-[10px] font-bold opacity-60">1.90x</span>
        </Button>
        <Button onClick={() => handleBetClick('Small')} className="h-20 bg-[#2979ff] rounded-2xl flex flex-col items-center justify-center">
          <span className="text-xl font-black uppercase italic">Small</span>
          <span className="text-[10px] font-bold opacity-60">1.90x</span>
        </Button>
      </div>

      <div className="bg-[#111] rounded-[2rem] p-6 mb-24">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent Results</h3>
        <div className="space-y-3">
          {recentResults?.map((res) => (
            <div key={res.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
              <span className="text-[10px] font-mono opacity-60">{res.period}</span>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded", res.bs === 'Big' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500')}>{res.bs}</span>
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", getNumberColor(res.num))}>{res.num}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isBettingOpen} onOpenChange={setIsBettingOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight">Place Bet: {betType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Amount</p>
              <div className="flex justify-between gap-1 overflow-x-auto pb-2">
                {[1, 5, 10, 20, 50, 100].map((amt) => (
                  <Button
                    key={amt}
                    variant="ghost"
                    onClick={() => setSelectedAmount(amt)}
                    className={cn(
                      "flex-1 h-12 min-w-[50px] rounded-xl font-bold transition-all border border-white/5 text-xs",
                      selectedAmount === amt ? "bg-primary text-white" : "bg-white/5 text-white/40"
                    )}
                  >
                    {amt}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={onConfirmBet} disabled={isPlacingBet} className="w-full h-14 bg-primary rounded-2xl font-bold text-lg">
              {isPlacingBet ? <Loader2 className="animate-spin" /> : `BET ₹${selectedAmount.toFixed(2)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
