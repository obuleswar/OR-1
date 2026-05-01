
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  ChevronLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trophy, 
  Gift, 
  Users,
  Search,
  History as HistoryIcon,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function HistoryPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  if (isUserLoading || isLoading) {
    return <div className="container mx-auto p-8 text-center text-muted-foreground font-body">Syncing history...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center h-[60vh] flex flex-col items-center justify-center font-body">
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
        <Link href="/login">
          <Button className="bg-primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case 'withdraw': return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
      case 'win': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'bonus': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'referral': return <Users className="w-5 h-5 text-pink-500" />;
      default: return <Search className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLabel = (type: string) => {
    if (type === 'withdraw') return 'Withdrawal';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Filter out 'bet' to focus on financial movements only (Deposit, Withdraw, Win, etc.)
  const financialTransactions = transactions?.filter(t => 
    ['deposit', 'withdraw', 'win', 'bonus', 'referral'].includes(t.type)
  ) || [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg min-h-screen pb-24 font-body">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Wallet History</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold">Withdrawals & Deposits</p>
        </div>
      </header>

      <div className="space-y-4">
        {financialTransactions.length === 0 ? (
          <div className="text-center py-20 bg-[#111] rounded-[2rem] border border-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
               <Wallet className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-sm font-bold text-white/40 uppercase tracking-widest">No wallet activity found</p>
          </div>
        ) : (
          financialTransactions.map((item) => (
            <Card key={item.id} className="bg-[#111] border-white/5 rounded-2xl overflow-hidden hover:bg-[#151515] transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{getLabel(item.type)}</h4>
                    <p className="text-[10px] text-muted-foreground font-bold opacity-60 mt-0.5">
                      {item.timestamp?.toDate ? format(item.timestamp.toDate(), 'dd MMM, hh:mm a') : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-black tracking-tighter",
                    ['win', 'deposit', 'bonus', 'referral'].includes(item.type) ? "text-green-500" : "text-red-500"
                  )}>
                    {['win', 'deposit', 'bonus', 'referral'].includes(item.type) ? "+" : "-"}
                    ₹{Number(item.amount).toFixed(2)}
                  </p>
                  <p className="text-[9px] text-white/30 font-bold uppercase truncate max-w-[120px] mt-0.5">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-white/5 text-center">
         <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">Transaction limit: Recent 50 records</p>
      </div>
    </div>
  );
}
