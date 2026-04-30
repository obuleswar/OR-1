
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

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
    subtitle: 'Fun Tasks',
    icon: Gamepad2,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    href: '#',
  },
  {
    id: 'mines',
    title: 'Mines',
    subtitle: 'Hidden Gems',
    icon: Bomb,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    href: '#',
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
    href: '#',
  },
  {
    id: 'dragon-tiger',
    title: 'Dragon vs Tiger',
    subtitle: 'Legendary Battle',
    icon: Sword,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    highlight: true,
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

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(userDocRef);

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Code Copied!",
      description: "Your referral code is ready to share.",
    });
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
                if (isRefer && profile?.ownReferralCode) {
                  copyReferralCode(profile.ownReferralCode);
                }
              }}
            >
              <CardContent className="p-0 h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
                  <Icon className={cn("w-8 h-8", task.color)} />
                  {isRefer && copied && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-1">
                  {task.title}
                </h3>

                {isRefer && profile?.ownReferralCode ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-90 flex items-center gap-1 justify-center">
                      <Copy className="w-2.5 h-2.5" />
                      {profile.ownReferralCode}
                    </p>
                    <p className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground opacity-40">
                      Tap to Copy
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
    </div>
  );
}
