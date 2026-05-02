
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth, initiateEmailSignIn, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { doc, getDocs, collection, query, where, serverTimestamp, increment } from 'firebase/firestore';
import { generateReferralCode } from '@/lib/utils';
import { createUserWithEmailAndPassword } from 'firebase/auth';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Automatically fill referral ID from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      initiateEmailSignIn(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const ownCode = generateReferralCode();
      const userRef = doc(db, 'users', user.uid);
      
      // Create user profile with ₹28 Sign up bonus
      setDocumentNonBlocking(userRef, {
        uid: user.uid,
        name: name.trim(),
        email: user.email,
        phoneNumber: phoneNumber.trim(),
        balance: 28, 
        requiredWager: 0,
        ownReferralCode: ownCode,
        referredBy: referralCode.trim().toUpperCase() || null,
        createdAt: serverTimestamp(),
        totalEarning: 28,
      }, { merge: true });

      // Welcome Bonus Transaction
      addDocumentNonBlocking(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'bonus',
        amount: 28,
        description: 'Welcome Sign-up Bonus',
        timestamp: serverTimestamp(),
      });

      // Handle referral bonus for the referrer
      if (referralCode.trim()) {
        const cleanCode = referralCode.trim().toUpperCase();
        const referrersQuery = query(collection(db, 'users'), where('ownReferralCode', '==', cleanCode));
        const referrerDocs = await getDocs(referrersQuery);
        
        if (!referrerDocs.empty) {
          const referrerDoc = referrerDocs.docs[0];
          const referrerId = referrerDoc.id;

          // Credit referrer ₹45
          updateDocumentNonBlocking(doc(db, 'users', referrerId), {
            balance: increment(45),
            totalEarning: increment(45)
          });

          // Log referral record
          addDocumentNonBlocking(collection(db, 'referrals'), {
            referrerUid: referrerId,
            referredUid: user.uid,
            amount: 45,
            timestamp: serverTimestamp(),
          });

          // Log transaction for referrer
          addDocumentNonBlocking(collection(db, 'transactions'), {
            userId: referrerId,
            type: 'referral',
            amount: 45,
            description: `Referral bonus for inviting ${name || user.email}`,
            timestamp: serverTimestamp()
          });
        }
      }

      toast({ title: 'Welcome! ₹28 Added', description: 'Your sign-up bonus has been credited.' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md bg-[#111] border-white/10">
        <Tabs defaultValue="signin">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="m@example.com"
                    className="bg-white/5 border-white/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    className="bg-white/5 border-white/10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary font-bold h-12 rounded-xl" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your name"
                    className="bg-white/5 border-white/10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="m@example.com"
                    className="bg-white/5 border-white/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="Enter phone number"
                    className="bg-white/5 border-white/10"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    className="bg-white/5 border-white/10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-referral">Refer ID (Auto-filled)</Label>
                  <Input
                    id="signup-referral"
                    type="text"
                    placeholder="ENTER CODE"
                    className="uppercase bg-white/5 border-primary/30"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary font-bold h-12 rounded-xl" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[80vh] text-white">Loading Auth...</div>}>
      <LoginContent />
    </Suspense>
  );
}
