'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { 
  ChevronLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Dices, 
  Trophy, 
  Gift, 
  Users,
  Search,
  History as HistoryIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    return <div className="container mx-auto p-8 text-center text-muted-foreground">Loading history...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case 'withdraw': return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
      case 'bet': return <Dices className="w-5 h-5 text-blue-500" />;
      case 'win': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'bonus': return <Gift className="w-5 h-5 text-purple-500" />;
      case 'referral': return <Users className="w-5 h-5 text-pink-500" />;
      default: return <Search className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const filterTransactions = (type: string | string[]) => {
    if (!transactions) return [];
    if (type === 'all') return transactions;
    const types = Array.isArray(type) ? type : [type];
    return transactions.filter(t => types.includes(t.type));
  };

  const TransactionList = ({ items }: { items: any[] }) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
          <p>No records found</p>
        </div>
      ) : (
        items.map((item) => (
          <Card key={item.id} className="bg-[#111] border-white/5 overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{getLabel(item.type)}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {item.timestamp?.toDate ? format(item.timestamp.toDate(), 'dd MMM yyyy, hh:mm a') : 'Recent'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-sm font-black",
                  ['win', 'deposit', 'bonus', 'referral'].includes(item.type) ? "text-green-500" : "text-red-500"
                )}>
                  {['win', 'deposit', 'bonus', 'referral'].includes(item.type) ? "+" : "-"}
                  ₹{Number(item.amount).toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg min-h-screen pb-24">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">History Center</h1>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-4 bg-[#111] p-1 rounded-xl h-12 mb-6">
          <TabsTrigger value="all" className="rounded-lg text-[10px] font-bold uppercase tracking-wider">All</TabsTrigger>
          <TabsTrigger value="games" className="rounded-lg text-[10px] font-bold uppercase tracking-wider">Games</TabsTrigger>
          <TabsTrigger value="financial" className="rounded-lg text-[10px] font-bold uppercase tracking-wider">Money</TabsTrigger>
          <TabsTrigger value="bonus" className="rounded-lg text-[10px] font-bold uppercase tracking-wider">Bonus</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TransactionList items={filterTransactions('all')} />
        </TabsContent>
        <TabsContent value="games">
          <TransactionList items={filterTransactions(['bet', 'win'])} />
        </TabsContent>
        <TabsContent value="financial">
          <TransactionList items={filterTransactions(['deposit', 'withdraw'])} />
        </TabsContent>
        <TabsContent value="bonus">
          <TransactionList items={filterTransactions(['bonus', 'referral'])} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
