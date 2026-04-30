
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { IndianRupee, Zap, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function WingoPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedAmount, setSelectedAmount] = useState(10);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      m1: Math.floor(mins / 10),
      m2: mins % 10,
      s1: Math.floor(secs / 10),
      s2: secs % 10,
    };
  };

  const time = formatTime(timeLeft);

  const amounts = [1, 5, 10, 50, 100];
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-gradient-to-br from-purple-500 to-red-500';
    if (num === 5) return 'bg-gradient-to-br from-purple-500 to-green-500';
    if ([1, 3, 7, 9].includes(num)) return 'bg-[#00e676]';
    return 'bg-[#ff1744]';
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-lg min-h-screen bg-[#050505] text-white pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/earn">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/5">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex-1 flex justify-center">
          <div className="bg-[#00d2ff]/20 border border-[#00d2ff]/40 px-6 py-2 rounded-xl flex flex-col items-center shadow-[0_0_15px_rgba(0,210,255,0.3)]">
            <Zap className="w-4 h-4 text-[#00d2ff] mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00d2ff]">1 MIN</span>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] rounded-[2rem] p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
              <div className="bg-yellow-400 rounded-full p-0.5">
                <IndianRupee className="w-3 h-3 text-black" />
              </div>
              <span className="font-bold text-sm">₹{profile?.balance?.toLocaleString() || '0.00'}</span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Count Down</p>
              <div className="flex items-center gap-1.5">
                <div className="bg-black/30 w-8 h-10 rounded-lg flex items-center justify-center text-xl font-bold">{time.m1}</div>
                <div className="bg-black/30 w-8 h-10 rounded-lg flex items-center justify-center text-xl font-bold">{time.m2}</div>
                <span className="text-xl font-bold mx-0.5">:</span>
                <div className="bg-black/30 w-8 h-10 rounded-lg flex items-center justify-center text-xl font-bold text-[#00e676]">{time.s1}</div>
                <div className="bg-black/30 w-8 h-10 rounded-lg flex items-center justify-center text-xl font-bold text-[#00e676]">{time.s2}</div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Period ID</p>
            <p className="text-xl font-bold tracking-tight">2026043010000861</p>
          </div>
        </div>
      </div>

      {/* Color Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="space-y-2">
          <Button className="w-full h-16 bg-[#00e676] hover:bg-[#00e676]/90 text-white rounded-2xl shadow-[0_4px_0_#00a856] active:translate-y-[2px] active:shadow-none font-bold text-lg">GREEN</Button>
          <div className="bg-black/40 py-1 rounded-full text-center">
            <span className="text-[8px] font-bold uppercase tracking-tighter text-green-500">Spend: ₹0</span>
          </div>
        </div>
        <div className="space-y-2">
          <Button className="w-full h-16 bg-[#9c27b0] hover:bg-[#9c27b0]/90 text-white rounded-2xl shadow-[0_4px_0_#7b1fa2] active:translate-y-[2px] active:shadow-none font-bold text-lg">VIOLET</Button>
          <div className="bg-black/40 py-1 rounded-full text-center">
            <span className="text-[8px] font-bold uppercase tracking-tighter text-purple-400">Spend: ₹0</span>
          </div>
        </div>
        <div className="space-y-2">
          <Button className="w-full h-16 bg-[#ff1744] hover:bg-[#ff1744]/90 text-white rounded-2xl shadow-[0_4px_0_#d50000] active:translate-y-[2px] active:shadow-none font-bold text-lg">RED</Button>
          <div className="bg-black/40 py-1 rounded-full text-center">
            <span className="text-[8px] font-bold uppercase tracking-tighter text-red-500">Spend: ₹0</span>
          </div>
        </div>
      </div>

      {/* Number Grid */}
      <div className="bg-[#111] rounded-[2rem] p-6 mb-6">
        <div className="grid grid-cols-5 gap-4">
          {numbers.map((num) => (
            <Button
              key={num}
              className={cn(
                "w-14 h-14 rounded-full text-xl font-bold p-0 shadow-lg",
                getNumberColor(num)
              )}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>

      {/* Big/Small Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="space-y-2">
          <Button className="w-full h-16 bg-[#ff9100] hover:bg-[#ff9100]/90 text-white rounded-2xl shadow-[0_4px_0_#ef6c00] active:translate-y-[2px] active:shadow-none font-bold text-xl uppercase italic">Big</Button>
          <div className="bg-black/40 py-1 rounded-full text-center">
            <span className="text-[8px] font-bold uppercase tracking-tighter text-orange-400">Spend: ₹0</span>
          </div>
        </div>
        <div className="space-y-2">
          <Button className="w-full h-16 bg-[#2979ff] hover:bg-[#2979ff]/90 text-white rounded-2xl shadow-[0_4px_0_#2962ff] active:translate-y-[2px] active:shadow-none font-bold text-xl uppercase italic">Small</Button>
          <div className="bg-black/40 py-1 rounded-full text-center">
            <span className="text-[8px] font-bold uppercase tracking-tighter text-blue-400">Spend: ₹0</span>
          </div>
        </div>
      </div>

      {/* Amount Selector */}
      <div className="bg-[#111] rounded-full p-2 flex justify-between items-center px-4">
        {amounts.map((amount) => (
          <Button
            key={amount}
            variant="ghost"
            onClick={() => setSelectedAmount(amount)}
            className={cn(
              "w-12 h-12 rounded-full font-bold text-sm transition-all",
              selectedAmount === amount 
                ? "bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.5)] scale-110" 
                : "text-white/40 hover:text-white"
            )}
          >
            {amount}
          </Button>
        ))}
      </div>
    </div>
  );
}
