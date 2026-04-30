
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Wallet, Zap, Loader2, Copy, CheckCircle2, Building2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const ADMIN_UPI_ID = "orwallet@okaxis";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  // Deposit States
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [depositEmail, setDepositEmail] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Withdrawal States
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawEmail, setWithdrawEmail] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const copyUpi = () => {
    navigator.clipboard.writeText(ADMIN_UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "UPI ID Copied",
      description: "You can now paste it in your payment app.",
    });
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    
    if (!depositAmount || isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid amount.' });
      return;
    }

    if (!utr) {
      toast({ variant: 'destructive', title: 'Invalid UTR', description: 'Please enter your Transaction ID.' });
      return;
    }

    setIsDepositing(true);
    try {
      if (userDocRef && db) {
        await updateDoc(userDocRef, {
          balance: increment(amount),
          lastDepositAt: serverTimestamp(),
        });

        toast({
          title: 'Deposit submitted',
          description: `₹${amount.toLocaleString()} will be verified and added to your wallet.`,
        });
        setIsDepositOpen(false);
        setDepositAmount('');
        setUtr('');
        setDepositEmail('');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deposit failed', description: error.message });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    const currentBalance = profile?.balance || 0;

    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid amount.' });
      return;
    }

    if (amount > currentBalance) {
      toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'You do not have enough balance to withdraw this amount.' });
      return;
    }

    if (!withdrawDetails) {
      toast({ variant: 'destructive', title: 'Missing Details', description: 'Please enter your payment details.' });
      return;
    }

    setIsWithdrawing(true);
    try {
      if (userDocRef && db) {
        await updateDoc(userDocRef, {
          balance: increment(-amount),
          lastWithdrawAt: serverTimestamp(),
        });

        toast({
          title: 'Withdrawal processing',
          description: `₹${amount.toLocaleString()} has been requested for withdrawal.`,
        });
        setIsWithdrawOpen(false);
        setWithdrawAmount('');
        setWithdrawDetails('');
        setWithdrawEmail('');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Withdrawal failed', description: error.message });
    } finally {
      setIsWithdrawing(false);
    }
  };

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
      
      <Card className="bg-primary text-primary-foreground border-none rounded-[2rem] shadow-2xl overflow-hidden relative">
        <CardContent className="p-8">
          <div className="space-y-1 mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Available Balance</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tighter">₹{profile?.balance?.toLocaleString() || '0.00'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => setIsWithdrawOpen(true)}
              className="bg-[#1a1a1a] hover:bg-black text-white h-14 rounded-2xl border-none font-bold uppercase text-xs tracking-wider shadow-lg"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
            <Button 
              onClick={() => setIsDepositOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white h-14 rounded-2xl border-none font-bold uppercase text-xs tracking-wider shadow-lg"
            >
              <Zap className="w-4 h-4 mr-2" />
              Deposit
            </Button>
          </div>
        </CardContent>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-[425px] rounded-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Deposit Funds</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Transfer funds via UPI and provide details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 mb-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin UPI ID</Label>
            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="font-mono text-sm tracking-tight text-primary">{ADMIN_UPI_ID}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50 hover:text-white" onClick={copyUpi}>
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="d-amount" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount (INR)</Label>
              <Input
                id="d-amount"
                type="number"
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utr" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">UTR / Transaction ID</Label>
              <Input
                id="utr"
                placeholder="12 Digit UTR Number"
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <Input
                id="d-email"
                type="email"
                placeholder="your@email.com"
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                value={depositEmail}
                onChange={(e) => setDepositEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isDepositing} className="w-full bg-primary h-12 rounded-xl font-bold uppercase">
              {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Deposit'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-[425px] rounded-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-white">Withdraw Funds</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Withdraw your balance to your UPI or Bank Account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="w-amount" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount (INR)</Label>
              <Input
                id="w-amount"
                type="number"
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
              <p className="text-[10px] text-muted-foreground">Available: ₹{profile?.balance || 0}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment Method</Label>
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white">
                  <SelectItem value="upi">UPI Transfer</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {withdrawMethod === 'upi' ? 'UPI ID' : 'Bank Details (Acc No, IFSC)'}
              </Label>
              <Input
                id="details"
                placeholder={withdrawMethod === 'upi' ? "example@upi" : "Account Number, IFSC, Name"}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                value={withdrawDetails}
                onChange={(e) => setWithdrawDetails(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="w-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <Input
                id="w-email"
                type="email"
                placeholder="your@email.com"
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                value={withdrawEmail}
                onChange={(e) => setWithdrawEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isWithdrawing} className="w-full bg-white text-black hover:bg-white/90 h-12 rounded-xl font-bold uppercase">
              {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Withdrawal'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
