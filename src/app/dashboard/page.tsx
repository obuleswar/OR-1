
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  if (isUserLoading || isProfileLoading) {
    return <div className="container mx-auto p-8 text-center">Loading your dashboard...</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-8 text-center">Please sign in to view your dashboard.</div>;
  }

  const copyReferral = () => {
    if (profile?.ownReferralCode) {
      navigator.clipboard.writeText(profile.ownReferralCode);
      toast({ title: 'Copied!', description: 'Your referral code is ready to share.' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">₹{profile?.balance || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Referral Code</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-md">
                {profile?.ownReferralCode || '------'}
              </div>
              <Button size="icon" variant="outline" onClick={copyReferral}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Earn <span className="text-primary font-bold">₹45</span> for every friend who joins!
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">1</div>
            <p>Share your code with friends</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">2</div>
            <p>They enter code during sign up</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">3</div>
            <p>You get ₹45 instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
}
