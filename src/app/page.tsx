
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IndianRupee, ArrowRight, Wallet, History, Zap, LayoutDashboard, ChevronRight, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, increment, collection } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { isToday } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const canClaimBonus = useMemo(() => {
    if (!profile) return false;
    if (!profile.lastBonusAt) return true;
    
    const lastDate = profile.lastBonusAt.toDate ? profile.lastBonusAt.toDate() : new Date(profile.lastBonusAt);
    return !isToday(lastDate);
  }, [profile]);

  const handleClaimBonus = async () => {
    if (!user || !userDocRef || !db) return;
    if (!canClaimBonus) {
      toast({
        title: "Already Claimed",
        description: "You have already claimed your daily bonus today. Come back tomorrow!",
      });
      return;
    }

    setIsClaiming(true);

    try {
      const bonusAmount = 0.48;
      
      updateDocumentNonBlocking(userDocRef, {
        balance: increment(bonusAmount),
        totalEarning: increment(bonusAmount),
        lastBonusAt: serverTimestamp()
      });

      addDocumentNonBlocking(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'bonus',
        amount: bonusAmount,
        description: 'Daily Check-in Bonus',
        timestamp: serverTimestamp()
      });

      toast({
        title: "Bonus Claimed!",
        description: `₹${bonusAmount.toFixed(2)} added to your wallet.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Claim Failed",
        description: "Could not claim bonus at this time.",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (isUserLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  // Logged In Home Experience
  if (user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6 pb-24">
        {/* Available Balance Card */}
        <Card className="bg-primary text-primary-foreground border-none rounded-[2rem] shadow-2xl overflow-hidden relative">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Available Balance</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">₹{Number(profile?.balance || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold">VIP</div>
            </div>

            <div className="flex gap-3 mt-10">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full bg-[#1a1a1a] hover:bg-black text-white h-12 rounded-xl border-none font-bold uppercase text-xs tracking-wider">
                  <Wallet className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white h-12 rounded-xl border-none font-bold uppercase text-xs tracking-wider">
                  <Zap className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
              </Link>
            </div>
          </CardContent>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        </Card>

        {/* Earning Zone */}
        <div className="space-y-4 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground px-1">Earning Zone</p>
          <Link href="/earn">
            <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg">
              START TASKS
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Daily Bonus Section */}
        <section className="bg-muted/10 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="text-primary h-4 w-4" />
              </div>
              <h2 className="font-bold text-white">Daily Bonus</h2>
            </div>
            <span className={cn("text-xs font-bold", canClaimBonus ? "text-primary" : "text-muted-foreground")}>
              {canClaimBonus ? "Ready" : "Claimed"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {canClaimBonus 
              ? "Check in today to receive your ₹0.48 bonus reward!" 
              : "You've already collected today's reward. Come back tomorrow for more!"}
          </p>
          <Button 
            variant={canClaimBonus ? "default" : "outline"}
            className={cn(
              "w-full font-bold h-10 rounded-xl transition-all",
              canClaimBonus ? "bg-primary text-white" : "border-white/10 text-white/40 cursor-not-allowed"
            )}
            onClick={handleClaimBonus}
            disabled={!canClaimBonus || isClaiming}
          >
            {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : canClaimBonus ? "Claim ₹0.48 Bonus" : "Claimed Today"}
          </Button>
        </section>
      </div>
    );
  }

  // Guest Landing Page
  return (
    <div className="flex flex-col min-h-[80vh]">
      <section className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-[#0a0a0a] to-background">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
            Earning Made <span className="text-primary">Simple</span>.
          </h1>
          <p className="text-xl text-muted-foreground md:text-2xl max-w-2xl mx-auto">
            Join the fastest growing digital wallet in India. Manage transactions, refer friends, and earn real rewards instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:px-12 text-lg h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full">
                Get Started Now
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:px-12 text-lg h-14 border-white/20 text-white hover:bg-white/5 rounded-full">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border border-white/5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <IndianRupee className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white">Fast Payouts</h3>
            <p className="text-muted-foreground">Get your earnings credited directly to your account with zero delay.</p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border border-white/5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white">Refer & Earn</h3>
            <p className="text-muted-foreground">Share your unique code and earn ₹45 for every friend who joins.</p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border border-white/5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white">Secure Wallet</h3>
            <p className="text-muted-foreground">Military-grade encryption keeps your data and transactions safe.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
