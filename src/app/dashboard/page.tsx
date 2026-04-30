
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  if (isUserLoading || isProfileLoading) {
    return <div className="container mx-auto p-8 text-center text-muted-foreground">Syncing wallet...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
        <p className="text-muted-foreground mb-6">You need an account to access your wallet.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg space-y-8 pb-24">
      <header className="px-1">
        <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Wallet</h1>
        <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase opacity-50 mt-1">Funds Management</p>
      </header>
      
      {/* Wallet Balance Card */}
      <Card className="bg-primary text-primary-foreground border-none rounded-[2rem] shadow-2xl overflow-hidden relative">
        <CardContent className="p-8">
          <div className="space-y-1 mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Available Balance</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tighter">₹{profile?.balance?.toLocaleString() || '0.00'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button className="bg-[#1a1a1a] hover:bg-black text-white h-14 rounded-2xl border-none font-bold uppercase text-xs tracking-wider shadow-lg">
              <Wallet className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
            <Button className="bg-white/10 hover:bg-white/20 text-white h-14 rounded-2xl border-none font-bold uppercase text-xs tracking-wider shadow-lg">
              <Zap className="w-4 h-4 mr-2" />
              Deposit
            </Button>
          </div>
        </CardContent>
        {/* Subtle decorative element */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </Card>

      <div className="pt-4 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground leading-relaxed opacity-40">
          Securely manage your INR balance. Payouts are processed to your linked account within 24 hours.
        </p>
      </div>
    </div>
  );
}
