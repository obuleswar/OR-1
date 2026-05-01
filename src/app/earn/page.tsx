
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tv,
  Gamepad2,
  Bomb,
  Dices,
  Layers,
  Sword,
  Users,
  Copy,
  CheckCircle2,
  MessageCircle,
  Share2,
  TrendingUp,
  Gift,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const EARNING_TASKS = [
  {
    id: 'watch-ads',
    title: 'Watch Ads',
    subtitle: 'High Rewards',
    icon: Tv,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    href: '#',
  },
  {
    id: 'play-games',
    title: 'Play Games',
    subtitle: 'Multiple Games',
    icon: Gamepad2,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    highlight: true,
    href: '/earn/play-games',
  },
  {
    id: 'mines',
    title: 'Mines',
    subtitle: 'Hidden Gems',
    icon: Bomb,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    href: '/earn/mines',
  },
  {
    id: 'wingo',
    title: 'Wingo',
    subtitle: 'Color Luck',
    icon: Dices,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    href: '/earn/wingo',
  },
  {
    id: 'k3-lotre',
    title: 'K3 Lotre',
    subtitle: 'Dice Prediction',
    icon: Layers,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    href: '/earn/k3',
  },
  {
    id: 'dragon-tiger',
    title: 'Dragon vs Tiger',
    subtitle: 'Legendary Battle',
    icon: Sword,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    href: '/earn/dragon-tiger',
  },
  {
    id: 'lucky-draw',
    title: 'Lucky Draw',
    subtitle: 'Spin & Win',
    icon: Trophy,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    href: '#',
  },
  {
    id: 'refer-earn',
    title: 'Refer & Earn',
    subtitle: 'Invite Friends',
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    href: '#',
  },
];

export default function EarnPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isReferDialogOpen, setIsReferDialogOpen] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const referralsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(collection(db, 'referrals'), where('referrerUid', '==', user.uid));
  }, [db, user?.uid]);

  const { data: referrals } = useCollection(referralsQuery);

  const referralCount = referrals?.length || 0;
  const totalReferralEarnings = referrals?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Code Copied!",
      description: "Your referral code is ready to share.",
    });
  };

  const shareOnWhatsApp = () => {
    if (!profile?.ownReferralCode) return;
    const text = `Hey! Join OR WALLET and get ₹28 instantly. Use my referral code: ${profile.ownReferralCode}. Start earning real cash today! Join here: ${window.location.origin}/login?ref=${profile.ownReferralCode}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (isUserLoading) {
    return <div className="container mx-auto p-8 text-center text-muted-foreground">Loading earning tasks...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4 text-white">Please sign in</h2>
        <p className="text-muted-foreground mb-6">You need an account to start earning.</p>
        <Link href="/login">
          <button className="bg-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider">Sign In Now</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg pb-24">
      <div className="grid grid-cols-2 gap-4">
        {EARNING_TASKS.map((task) => {
          const Icon = task.icon;
          const isRefer = task.id === 'refer-earn';

          const content = (
            <Card
              className={cn(
                "bg-[#111111] border-white/5 hover:bg-[#161616] transition-all cursor-pointer h-52 group overflow-hidden relative",
                task.highlight && "border-primary/30"
              )}
              onClick={() => {
                if (isRefer) {
                  setIsReferDialogOpen(true);
                }
              }}
            >
              <CardContent className="p-0 h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
                  <Icon className={cn("w-8 h-8", task.color)} />
                </div>

                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-1">
                  {task.title}
                </h3>

                {isRefer && profile?.ownReferralCode ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-90 flex items-center gap-1 justify-center">
                      {referralCount} Referred
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground opacity-40">
                      Tap for details
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">
                    {task.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          );

          if (task.href !== '#' && !isRefer) {
            return (
              <Link key={task.id} href={task.href}>
                {content}
              </Link>
            );
          }

          return <div key={task.id}>{content}</div>;
        })}
      </div>

      <Dialog open={isReferDialogOpen} onOpenChange={setIsReferDialogOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2rem] max-w-md mx-auto">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-black italic tracking-tighter text-primary uppercase">Refer & Earn</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center">
                <Users className="w-5 h-5 text-purple-400 mb-1" />
                <span className="text-2xl font-black">{referralCount}</span>
                <span className="text-[10px] font-bold uppercase text-white/40">Total Referrals</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center">
                <Gift className="w-5 h-5 text-green-400 mb-1" />
                <span className="text-2xl font-black">₹{totalReferralEarnings.toFixed(2)}</span>
                <span className="text-[10px] font-bold uppercase text-white/40">Total Earned</span>
              </div>
            </div>

            <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20 relative overflow-hidden">
               <div className="relative z-10 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Your Referral Code</span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black tracking-widest">{profile?.ownReferralCode || '------'}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 text-primary"
                      onClick={() => profile?.ownReferralCode && copyReferralCode(profile.ownReferralCode)}
                    >
                      {copied ? <CheckCircle2 className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    </Button>
                  </div>
               </div>
               <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-primary/5 -rotate-12" />
            </div>

            <div className="space-y-3">
              <p className="text-center text-xs text-white/40 px-4">
                Invite friends and earn ₹45 instantly for every successful referral after they join and play!
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={shareOnWhatsApp}
                  className="bg-[#25D366] hover:bg-[#128C7E] text-white h-14 rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  Share on WhatsApp
                </Button>
                <Button 
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 text-white h-14 rounded-2xl font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  onClick={() => profile?.ownReferralCode && copyReferralCode(profile.ownReferralCode)}
                >
                  <Share2 className="w-4 h-4" />
                  Copy Invite Link
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
