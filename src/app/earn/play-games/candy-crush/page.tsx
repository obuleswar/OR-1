
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import { ChevronLeft, IndianRupee, Loader2, Zap, Trophy, ShieldCheck, Timer } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GAME_TIME = 300; // 5 Minutes
const GAME_URL = "https://html5.gamemonetize.co/jb0dcjocnv110l3a3tmmdxbnto6gwv8g/";
const REWARD_AMOUNT = 0.05;

export default function CandyCrushPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [timeLeft, setTimeLeft] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);

  // Captcha State
  const [isCaptchaOpen, setIsCaptchaOpen] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState({ a: 0, b: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

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

    setIsProcessing(true);
    
    setTimeLeft(GAME_TIME);
    setGameState('playing');
    setIsProcessing(false);
  };

  const handleEndGame = () => {
    setGameState('ended');
    generateCaptcha();
    setIsCaptchaOpen(true);
  };

  const generateCaptcha = () => {
    setCaptchaQuestion({
      a: Math.floor(Math.random() * 10) + 1,
      b: Math.floor(Math.random() * 10) + 1
    });
    setCaptchaInput('');
  };

  const handleCaptchaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const answer = captchaQuestion.a + captchaQuestion.b;
    
    if (parseInt(captchaInput) === answer) {
      setIsCaptchaOpen(false);
      await processReward();
    } else {
      toast({ variant: 'destructive', title: 'Invalid Captcha', description: 'Please try again.' });
      generateCaptcha();
    }
  };

  const processReward = async () => {
    if (userDocRef && db) {
      updateDocumentNonBlocking(userDocRef, {
        balance: increment(REWARD_AMOUNT),
        totalEarning: increment(REWARD_AMOUNT)
      });

      addDocumentNonBlocking(collection(db, 'transactions'), {
        userId: user!.uid,
        type: 'win',
        amount: REWARD_AMOUNT,
        description: `Candy Crush Session Completion Reward`,
        timestamp: serverTimestamp()
      });

      toast({ 
        title: 'Verification Successful!', 
        description: `Session completed! You earned ₹${REWARD_AMOUNT.toFixed(2)}!` 
      });
      setGameState('idle');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === 'playing') {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in duration-500">
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-[10000] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 pointer-events-auto shadow-2xl">
            <Timer className={cn("w-5 h-5", timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-400")} />
            <span className={cn("text-2xl font-black font-mono", timeLeft <= 10 ? "text-red-500" : "text-blue-400")}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
                if (window.confirm("Exit game? Your current session progress will be lost.")) {
                    setGameState('idle');
                    setTimeLeft(0);
                }
            }} 
            className="bg-black/60 backdrop-blur-md h-12 w-12 rounded-2xl border border-white/10 text-white/40 hover:text-white pointer-events-auto shadow-2xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </div>
        <iframe 
          src={GAME_URL}
          className="w-full h-full border-none"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-lg min-h-[calc(100vh-64px)] bg-[#050505] text-white pb-24 font-body flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <Link href="/earn/play-games">
          <Button variant="ghost" size="icon" className="text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div className="flex flex-col items-center">
           <h1 className="text-2xl font-black tracking-tighter italic text-pink-500 uppercase">Candy Crush</h1>
           <p className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Free To Play</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="bg-[#1a1a1a] px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/5">
            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
              <IndianRupee className="w-2.5 h-2.5 text-black" />
            </div>
            <span className="text-xs font-bold">₹{Number(profile?.balance || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0 animate-in fade-in slide-in-from-top-4">
        <div className="bg-[#111] p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Status</p>
          <p className="text-sm font-black text-pink-400 uppercase tracking-widest">
            {gameState === 'playing' ? 'Active' : 'Idle'}
          </p>
          <Zap className="absolute -right-2 -bottom-2 w-12 h-12 text-pink-500/10" />
        </div>
        <div className="bg-[#111] p-4 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
          <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Session</p>
          <p className="text-sm font-black text-blue-400 uppercase tracking-widest">5 Minutes</p>
          <Trophy className="absolute -right-2 -bottom-2 w-12 h-12 text-blue-500/10" />
        </div>
      </div>

      <div className="relative flex-1 mb-6">
        <div className="absolute inset-0 bg-[#0a0a0a] rounded-[1.5rem] border border-white/10 shadow-2xl overflow-hidden">
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] p-8 text-center">
            {gameState === 'idle' ? (
              <>
                <div className="text-6xl mb-6 animate-bounce">🍬</div>
                <p className="text-lg font-bold text-white uppercase tracking-widest max-w-[200px]">
                  Complete 5m Session to Earn ₹{REWARD_AMOUNT.toFixed(2)}
                </p>
              </>
            ) : (
              <div className="text-center animate-in zoom-in duration-300">
                <p className="text-3xl font-black text-pink-500 uppercase italic mb-2">Session Ended</p>
                <p className="text-sm font-bold text-white/60 mb-6 uppercase tracking-widest">5 Minute Playtime Completed</p>
                <Button 
                  onClick={() => setIsCaptchaOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-white font-black uppercase px-12 h-14 rounded-2xl shadow-lg"
                >
                  Verify & Claim Reward
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#111] p-6 rounded-[2rem] border border-white/5 space-y-6 flex-shrink-0 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Reward Info</p>
          <div className="bg-primary/10 border border-primary/20 px-3 py-0.5 rounded-full">
            <span className="text-[10px] font-black text-primary uppercase">Fixed ₹{REWARD_AMOUNT.toFixed(2)}</span>
          </div>
        </div>

        <Button 
          onClick={handleStartGame}
          disabled={isProcessing}
          className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-lg"
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : "START SESSION"}
        </Button>
      </div>

      <Dialog open={isCaptchaOpen} onOpenChange={setIsCaptchaOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white rounded-3xl max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" />
              Human Verification
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="bg-white/5 p-6 rounded-2xl text-center border border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4">Solve to claim rewards</p>
              <div className="text-4xl font-black tracking-widest text-yellow-400">
                {captchaQuestion.a} + {captchaQuestion.b} = ?
              </div>
            </div>
            
            <form onSubmit={handleCaptchaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="captcha" className="text-[10px] font-bold uppercase tracking-widest opacity-60">Your Answer</Label>
                <Input
                  id="captcha"
                  type="number"
                  placeholder="Enter the sum..."
                  className="bg-white/5 border-white/10 h-14 text-center text-xl font-bold"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full h-14 bg-primary font-black uppercase text-lg rounded-xl">
                Verify & Claim
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
