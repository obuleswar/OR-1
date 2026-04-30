'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Share2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.347-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.675 1.439 5.662 1.439h.05c6.505 0 11.87-5.335 11.873-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function EarnPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  if (isUserLoading || isProfileLoading) {
    return <div className="container mx-auto p-8 text-center">Loading earning details...</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-8 text-center">Please sign in to access earning tasks.</div>;
  }

  const copyReferral = () => {
    if (profile?.ownReferralCode) {
      navigator.clipboard.writeText(profile.ownReferralCode);
      toast({ title: 'Copied!', description: 'Your referral code is ready to share.' });
    }
  };

  const shareOnWhatsApp = () => {
    if (profile?.ownReferralCode) {
      const text = `Join OR WALLET and start earning! Use my referral code: ${profile.ownReferralCode} during sign up. Join now: ${window.location.origin}/login`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Gift className="text-primary" /> Refer & Earn
        </h1>
        <p className="text-muted-foreground mt-2">Earn ₹45 for every friend you invite!</p>
      </header>

      <Card className="mb-8 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Your Exclusive Code
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="text-4xl font-mono font-bold tracking-[0.2em] bg-background border px-8 py-4 rounded-xl shadow-inner">
            {profile?.ownReferralCode || '------'}
          </div>
          <div className="flex gap-4 w-full max-w-xs">
            <Button variant="outline" className="flex-1" onClick={copyReferral}>
              <Share2 className="mr-2 h-4 w-4" /> Copy
            </Button>
            <Button className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={shareOnWhatsApp}>
              <WhatsAppIcon className="mr-2 h-5 w-5" /> WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-bold">How to earn?</h2>
        <div className="grid gap-4">
          {[
            { step: 1, text: 'Invite friends using your unique referral code.' },
            { step: 2, text: 'They join OR Wallet and verify their account.' },
            { step: 3, text: 'You get ₹45 instantly in your wallet!' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-card border">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                {item.step}
              </div>
              <p className="text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
