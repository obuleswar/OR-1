'use client';

import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tv, 
  Gamepad2, 
  Bomb, 
  Dices, 
  Layers, 
  Sword, 
  Users,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const EARNING_TASKS = [
  {
    id: 'watch-ads',
    title: 'Watch Ads',
    subtitle: 'High Rewards',
    icon: Tv,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    id: 'play-games',
    title: 'Play Games',
    subtitle: 'Fun Tasks',
    icon: Gamepad2,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    id: 'mines',
    title: 'Mines',
    subtitle: 'Hidden Gems',
    icon: Bomb,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    id: 'wingo',
    title: 'Wingo',
    subtitle: 'Color Luck',
    icon: Dices,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    id: 'k3-lotre',
    title: 'K3 Lotre',
    subtitle: 'Dice Prediction',
    icon: Layers,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
  },
  {
    id: 'dragon-tiger',
    title: 'Dragon vs Tiger',
    subtitle: 'Legendary Battle',
    icon: Sword,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    highlight: true,
  },
  {
    id: 'refer-earn',
    title: 'Refer & Earn',
    subtitle: 'Invite Friends',
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
];

export default function EarnPage() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="container mx-auto p-8 text-center">Loading earning tasks...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
        <p className="text-muted-foreground mb-6">You need an account to start earning.</p>
        <Link href="/login">
          <button className="bg-primary text-white px-8 py-3 rounded-full font-bold">Sign In Now</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg pb-24">
      <div className="grid grid-cols-2 gap-4">
        {EARNING_TASKS.map((task) => {
          const Icon = task.icon;
          return (
            <Link key={task.id} href={task.id === 'refer-earn' ? '/earn' : '#'}>
              <Card className={cn(
                "bg-[#111111] border-white/5 hover:bg-[#161616] transition-all cursor-pointer h-52 group",
                task.highlight && "border-primary/30"
              )}>
                <CardContent className="p-0 h-full flex flex-col items-center justify-center text-center">
                  {/* Icon Container */}
                  <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className={cn("w-8 h-8", task.color)} />
                  </div>
                  
                  {/* Text Content */}
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-1">
                    {task.title}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">
                    {task.subtitle}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
