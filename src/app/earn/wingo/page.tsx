
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { IndianRupee, Zap, ChevronLeft, Loader2, History, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { placeBet, settleRound } from './actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ROUND_TIME = 30;

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

  // Use a ref to track the last settled period to avoid double settlement
  const lastSettledPeriod = useRef<string | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const resultsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'wingo_results'), orderBy('period', 'desc'), limit(10));
  }, [db]);

  const { data: recentResults } = useCollection(resultsQuery);

  const generatePeriod = useCallback(() => {
    const now = new Date();
    const yyyymmdd = now.toISOString().split('T')[0].replace(/-/g, '');
    const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const roundNumber = Math.floor(secondsInDay / ROUND_TIME);
    return `${yyyymmdd}${roundNumber.toString().padStart(6, '0')}`;
  }, []);

  // Sync Period and Timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const period = generatePeriod();
      const secondsInRound = (now.getSeconds() % ROUND_TIME);
      const remaining = ROUND_TIME - secondsInRound;

      setTimeLeft(remaining);
      
      // Update the current active period in state if it changed
      if (period !== currentPeriod) {
        setCurrentPeriod(period);
      }

      // If we are at the very start of a new round, settle the PREVIOUS one
      if (remaining >= ROUND_TIME - 1) {
        // Calculate the previous period ID (crude but effective for 30s intervals)
        const prevPeriodNum = parseInt(period) - 1;
        const prevPeriod = prevPeriodNum.toString();

        if (lastSettledPeriod.current !== prevPeriod) {
          lastSettledPeriod.current = prevPeriod;
          settleRound(prevPeriod);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPeriod, generatePeriod]);

  const handleBetClick = (type: string) => {
    if (timeLeft <= 5) {
      toast({ variant: 'destructive', title: 'Betting Closed', description: 'Wait for next round.' });
      return;
    }
    setBetType(type);
    setIsBettingOpen(true);
  };

  const onConfirmBet = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Sign In Required', description: 'Please log in to place bets.' });
      return;
    }
    setIsPlacingBet(true);
    const res = await placeBet(user.uid, currentPeriod, betType, selectedAmount);
    if (res.success) {
      toast({ title: 'Bet Placed', description: `₹${selectedAmount} on ${betType}` });
      setIsBettingOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: res.error });
    }
    setIsPlacingBet(false);
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-gradient-to-br from-purple-500 to-red-500';
    if (num === 5) return 'bg-gradient-to-br from-purple-500 to-green-500';
    if ([1, 3, 7, 9].includes(num)) return 'bg-[#00e676]';
    return 'bg-[#ff1744]';
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-lg min-h-screen bg-[#050505] text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/earn">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/5">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="bg-[#00d2ff]/20 border border-[#00d2ff]/40 px-6 py-2 rounded-xl flex flex-col items-center shadow-[0_0_15px_rgba(0,210,255,0.3)]">
          <Zap className="w-4 h-4 text-[#00d2ff] mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#00d2ff]">30 SEC</span>
        </div>
        <div className="flex gap-2">
          <Link href="/earn/wingo/history">
            <Button variant="ghost" size="icon" className="text-white/60"><History className="h-5 w-5"/></Button>
          </Link>
          <Link href="/earn/wingo/my-bets">
            <Button variant="ghost" size="icon" className="text-white/60"><Trophy className="h-5 w-5"/></Button>
          </Link>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-primary to-[#ff4b2b] rounded-[2rem] p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
              <div className="bg-yellow-400 rounded-full p-0.5">
                <IndianRupee className="w-3 h-3 text-black" />
              </div>
              <span className="font-bold text-sm">₹{profile?.balance?.toLocaleString() || '0.00'}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Time Left</p>
              <div className="flex items-center gap-1.5">
                <div className="bg-black/30 w-10 h-12 rounded-lg flex items-center justify-center text-2xl font-bold text-[#00e676]">{timeLeft.toString().padStart(2, '0')}</div>
              </div>
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

      {/* Color Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Button onClick={() => handleBetClick('Green')} className="h-16 bg-[#00e676] hover:bg-[#00e676]/90 rounded-2xl font-bold text-lg">GREEN</Button>
        <Button onClick={() => handleBetClick('Violet')} className="h-16 bg-[#9c27b0] hover:bg-[#9c27b0]/90 rounded-2xl font-bold text-lg">VIOLET</Button>
        <Button onClick={() => handleBetClick('Red')} className="h-16 bg-[#ff1744] hover:bg-[#ff1744]/90 rounded-2xl font-bold text-lg">RED</Button>
      </div>

      {/* Number Grid */}
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

      {/* Big/Small Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button onClick={() => handleBetClick('Big')} className="h-16 bg-[#ff9100] hover:bg-[#ff9100]/90 rounded-2xl font-bold text-xl uppercase italic">Big</Button>
        <Button onClick={() => handleBetClick('Small')} className="h-16 bg-[#2979ff] hover:bg-[#2979ff]/90 rounded-2xl font-bold text-xl uppercase italic">Small</Button>
      </div>

      {/* Recent Results Table */}
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

      {/* Betting Dialog */}
      <Dialog open={isBettingOpen} onOpenChange={setIsBettingOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight">Place Bet: {betType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Amount</p>
              <div className="flex justify-between gap-2">
                {[10, 50, 100, 500, 1000].map((amt) => (
                  <Button
                    key={amt}
                    variant="ghost"
                    onClick={() => setSelectedAmount(amt)}
                    className={cn(
                      "flex-1 h-12 rounded-xl font-bold transition-all border border-white/5",
                      selectedAmount === amt ? "bg-primary text-white" : "bg-white/5 text-white/40"
                    )}
                  >
                    {amt}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={onConfirmBet} disabled={isPlacingBet} className="w-full h-14 bg-primary rounded-2xl font-bold text-lg">
              {isPlacingBet ? <Loader2 className="animate-spin" /> : `BET ₹${selectedAmount}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
