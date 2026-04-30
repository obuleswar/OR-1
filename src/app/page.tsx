'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IndianRupee, ShieldCheck, Zap, Users, Home as HomeIcon, Wallet, User, Gift } from 'lucide-react';
import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]">Loading...</div>;
  }

  // Logged In Home Experience
  if (user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Earning opportunities are waiting for you.</p>
        </header>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/earn" className="group">
            <Card className="h-full hover:border-primary/50 transition-colors bg-primary/5">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">Earn Now</h3>
                <p className="text-xs text-muted-foreground">Complete tasks & refer friends</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard" className="group">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">Wallet</h3>
                <p className="text-xs text-muted-foreground">Check your balance & payouts</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile" className="group">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">Profile</h3>
                <p className="text-xs text-muted-foreground">Manage your account settings</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/earn" className="group">
            <Card className="h-full hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold">Referrals</h3>
                <p className="text-xs text-muted-foreground">Invite friends and get rewards</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <section className="bg-muted/30 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-primary h-5 w-5" />
            <h2 className="font-bold">Daily Bonus Available</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Check in daily to increase your earnings multiplier. Consistency pays off!</p>
          <Button className="w-full sm:w-auto">Claim Daily Bonus</Button>
        </section>
      </div>
    );
  }

  // Guest Landing Page
  return (
    <div className="flex flex-col min-h-[80vh]">
      <section className="flex-grow flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-[#0a0a0a] to-background">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
            Earning Made <span className="text-primary">Simple</span>.
          </h1>
          <p className="text-xl text-muted-foreground md:text-2xl max-w-2xl mx-auto">
            Join the fastest growing digital wallet in India. Manage transactions, refer friends, and earn real rewards instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:px-12 text-lg h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full">
                Get Started Now
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:px-12 text-lg h-14 border-white/20 text-white hover:bg-white/5 rounded-full">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border border-white/5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <IndianRupee className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Fast Payouts</h3>
            <p className="text-muted-foreground">Get your earnings credited directly to your account with zero delay.</p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border border-white/5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Refer & Earn</h3>
            <p className="text-muted-foreground">Share your unique code and earn ₹45 for every friend who joins.</p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card border border-white/5 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Secure Wallet</h3>
            <p className="text-muted-foreground">Military-grade encryption keeps your data and transactions safe.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
