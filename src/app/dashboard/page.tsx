
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp, addDoc, collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Wallet, Zap, Loader2, Copy, CheckCircle2, ArrowUpCircle, ArrowDownCircle, Trophy, Gift, Users as UsersIcon, Search, History as HistoryIcon, Lock, ShieldAlert, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ADMIN_UPI_ID = "mine.pe@ptaxis";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [depositEmail, setDepositEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [withdrawEmail, setWithdrawEmail] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  // Transactions query
  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      limit(30)
    );
  }, [db, user?.uid]);

  const { data: transactions, isLoading: isTransactionsLoading } = useCollection(transactionsQuery);

  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions].sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeB - timeA;
    });
  }, [transactions]);

  const getIcon = (type: string, status?: string) => {
    if (status === 'pending') return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
    switch (type) {
      case 'deposit': return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case 'withdraw': return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
      case 'win': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'bonus': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'referral': return <UsersIcon className="w-5 h-5 text-pink-500" />;
      default: return <Search className="w-5 h-5 text-gray-500" />;
    }
  };

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
      toast({ variant: 'destructive', title: 'Invalid amount' });
      return;
    }

    if (!utr) {
      toast({ variant: 'destructive', title: 'Invalid UTR' });
      return;
    }

    if (userDocRef && db) {
      // NOTE: We no longer update the user balance directly.
      // The admin will verify the transaction manually in the console.
      
      // Log transaction as pending
      await addDoc(collection(db, 'transactions'), {
        userId: user!.uid,
        type: 'deposit',
        status: 'pending',
        amount: amount,
        description: `Deposit Request via UPI (UTR: ${utr})`,
        utr: utr,
        email: depositEmail,
        timestamp: serverTimestamp()
      });

      toast({
        title: 'Deposit submitted',
        description: `₹${amount.toFixed(2)} request has been sent for manual verification.`,
      });
      setIsDepositOpen(false);
      setDepositAmount('');
      setUtr('');
      setDepositEmail('');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    const currentBalance = profile?.balance || 0;
    const remainingWager = profile?.requiredWager || 0;

    if (!profile?.lastDepositAt) {
        toast({ variant: 'destructive', title: 'Account Not Verified', description: 'Please make a deposit to unlock withdrawals.' });
        return;
    }

    if (remainingWager > 0) {
      toast({ variant: 'destructive', title: 'Wagering Requirement Not Met', description: `You need to wager ₹${remainingWager.toFixed(2)} more before withdrawing.` });
      return;
    }

    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount' });
      return;
    }

    if (amount > currentBalance) {
      toast({ variant: 'destructive', title: 'Insufficient Funds' });
      return;
    }

    let details = "";
    if (withdrawMethod === 'upi') {
      if (!upiId) return;
      details = `UPI: ${upiId}`;
    } else {
      if (!bankAccount || !bankIfsc || !bankName) return;
      details = `Bank: ${bankName}, Acc: ${bankAccount}, IFSC: ${bankIfsc}`;
    }

    if (userDocRef && db) {
      updateDocumentNonBlocking(userDocRef, {
        balance: increment(-amount),
        lastWithdrawAt: serverTimestamp(),
        lastWithdrawDetails: { amount, method: withdrawMethod, details, email: withdrawEmail }
      });

      // Log transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user!.uid,
        type: 'withdraw',
        status: 'pending',
        amount: amount,
        description: `Withdrawal Request to ${withdrawMethod.toUpperCase()} (${details})`,
        timestamp: serverTimestamp()
      });

      toast({
        title: 'Withdrawal processing',
        description: `₹${amount.toFixed(2)} has been requested for withdrawal.`,
      });
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawEmail('');
    }
  };

  const remainingWager = profile?.requiredWager || 0;
  const hasDeposited = !!profile?.lastDepositAt;

  if (isUserLoading || isProfileLoading) {
    return <div className="container mx-auto p-8 text-center text-muted-foreground">Syncing wallet...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg space-y-8 pb-24">
      <header className="px-1 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Wallet</h1>
      </header>
      
      <Card className="bg-primary text-primary-foreground border-none rounded-[2rem] shadow-2xl overflow-hidden relative">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Available Balance</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tighter">₹{Number(profile?.balance || 0).toFixed(2)}</span>
              </div>
            </div>
            {(remainingWager > 0 || !hasDeposited) && (
              <div className="bg-black/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Lock className="w-3 h-3 text-white/60" />
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/60">Status</p>
                </div>
                <p className="text-xs font-black text-white">{!hasDeposited ? 'Locked' : `₹${remainingWager.toFixed(2)}`}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={() => setIsWithdrawOpen(true)}
              className="bg-[#1a1a1a] hover:bg-black text-white h-14 rounded-2xl border-none font-bold uppercase text-xs tracking-wider"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
            <Button 
              onClick={() => setIsDepositOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white h-14 rounded-2xl border-none font-bold uppercase text-xs tracking-wider"
            >
              <Zap className="w-4 h-4 mr-2" />
              Deposit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-white/40" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Recent Activity</h3>
          </div>
        </div>

        <div className="space-y-3">
          {isTransactionsLoading ? (
            <div className="text-center py-10 text-white/20 text-xs">Loading activity...</div>
          ) : sortedTransactions.length === 0 ? (
            <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/5">
              <p className="text-xs font-bold text-white/20 uppercase">No recent activity</p>
            </div>
          ) : (
            sortedTransactions.map((tx) => (
              <div key={tx.id} className="bg-[#111] border border-white/5 rounded-2xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-1">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                       {getIcon(tx.type, tx.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white uppercase">{tx.type}</p>
                        {tx.status === 'pending' && (
                          <span className="text-[8px] font-black bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded uppercase tracking-widest">Pending</span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/30 font-bold">
                        {tx.timestamp?.toDate ? format(tx.timestamp.toDate(), 'dd MMM, HH:mm') : 'Just now'}
                      </p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className={cn(
                      "text-sm font-black",
                      ['win', 'deposit', 'bonus', 'referral'].includes(tx.type) ? "text-green-500" : "text-red-500"
                    )}>
                      {['win', 'deposit', 'bonus', 'referral'].includes(tx.type) ? "+" : "-"}₹{Number(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-[9px] text-white/20 font-bold uppercase truncate max-w-[120px]">{tx.description}</p>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">Deposit Funds</DialogTitle>
          </DialogHeader>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 mb-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin UPI ID</Label>
            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="font-mono text-sm tracking-tight text-primary">{ADMIN_UPI_ID}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white/50" onClick={copyUpi}>
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <form onSubmit={handleDeposit} className="space-y-4">
            <Input
              type="number"
              placeholder="Amount (INR)"
              className="bg-white/5 border-white/10"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
            <Input
              placeholder="UTR / Transaction ID"
              className="bg-white/5 border-white/10"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              className="bg-white/5 border-white/10"
              value={depositEmail}
              onChange={(e) => setDepositEmail(e.target.value)}
              required
            />
            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 mb-2">
              <p className="text-[9px] font-bold text-blue-400 uppercase leading-relaxed">
                Your deposit will be manually verified by our team. Please allow up to 30 minutes for the balance to reflect in your wallet.
              </p>
            </div>
            <Button type="submit" className="w-full bg-primary font-bold uppercase h-12 rounded-xl">Submit Deposit Request</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight text-white">Withdraw Funds</DialogTitle>
          </DialogHeader>
          {!hasDeposited ? (
             <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-black uppercase text-blue-500">First Deposit Required</p>
              <p className="text-xs font-bold text-white/60">
                You must make at least one deposit to verify your account before you can unlock the withdrawal feature.
              </p>
              <Button 
                onClick={() => { setIsWithdrawOpen(false); setIsDepositOpen(true); }}
                className="mt-4 w-full bg-blue-500 text-white font-bold h-12 rounded-xl uppercase"
              >
                Make First Deposit
              </Button>
            </div>
          ) : remainingWager > 0 ? (
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center space-y-3">
              <Lock className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-lg font-black uppercase text-red-500">Withdrawal Locked</p>
              <p className="text-xs font-bold text-white/60">
                You must complete your wagering requirement of <span className="text-white">₹{remainingWager.toFixed(2)}</span> by playing games before you can withdraw.
              </p>
              <Link href="/earn">
                <Button className="mt-4 w-full bg-red-500 text-white font-bold h-12 rounded-xl uppercase">Start Playing</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <Input
                type="number"
                placeholder="Amount (INR)"
                className="bg-white/5 border-white/10"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
              />
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white">
                  <SelectItem value="upi">UPI Transfer</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                </SelectContent>
              </Select>
              {withdrawMethod === 'upi' ? (
                <Input
                  placeholder="UPI ID"
                  className="bg-white/5 border-white/10"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
              ) : (
                <div className="space-y-3">
                  <Input placeholder="Account Number" className="bg-white/5 border-white/10" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required />
                  <Input placeholder="IFSC Code" className="bg-white/5 border-white/10" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} required />
                  <Input placeholder="Account Holder Name" className="bg-white/5 border-white/10" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
                </div>
              )}
              <Input
                type="email"
                placeholder="Email"
                className="bg-white/5 border-white/10"
                value={withdrawEmail}
                onChange={(e) => setWithdrawEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full bg-white text-black font-bold uppercase h-12 rounded-xl">Confirm Withdrawal</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
