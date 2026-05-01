
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useFirestore, useUser, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs, increment } from 'firebase/firestore';

const ROUND_TIME = 60;

const ColorMap: Record<number, string[]> = {
  1: ['green'], 3: ['green'], 7: ['green'], 9: ['green'],
  2: ['red'], 4: ['red'], 6: ['red'], 8: ['red'],
  0: ['violet', 'red'],
  5: ['violet', 'green']
};

const K3_MULTIPLIERS: Record<string, number> = {
  '3': 207.36, '18': 207.36,
  '4': 69.12, '17': 69.12,
  '5': 34.56, '16': 34.56,
  '6': 20.74, '15': 20.74,
  '7': 13.83, '14': 13.83,
  '8': 9.88, '13': 9.88,
  '9': 8.3, '12': 8.3,
  '10': 7.68, '11': 7.68,
  'Big': 1.9, 'Small': 1.9,
  'Odd': 1.9, 'Even': 1.9
};

export function GameEngine() {
  const db = useFirestore();
  const { user } = useUser();
  const lastSettledWingo = useRef<string | null>(null);
  const lastSettledK3 = useRef<string | null>(null);
  const lastSettledDT = useRef<string | null>(null);

  const generatePeriod = useCallback((date: Date) => {
    const yyyymmdd = date.getUTCFullYear().toString() + 
                     (date.getUTCMonth() + 1).toString().padStart(2, '0') + 
                     date.getUTCDate().toString().padStart(2, '0');
    const secondsInDay = date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds();
    const roundNumber = Math.floor(secondsInDay / ROUND_TIME);
    return `${yyyymmdd}${roundNumber.toString().padStart(6, '0')}`;
  }, []);

  const settleWingo = async (period: string) => {
    if (!db || !user) return;
    try {
      const resultRef = doc(db, 'wingo_results', period);
      const resultSnap = await getDoc(resultRef);

      let num: number;
      let color: string[];
      let bs: 'Big' | 'Small';

      if (resultSnap.exists()) {
        const data = resultSnap.data();
        num = data.num;
        color = data.color;
        bs = data.bs;
      } else {
        num = Math.floor(Math.random() * 10);
        bs = num >= 5 ? 'Big' : 'Small';
        color = ColorMap[num];
        await setDoc(resultRef, { period, num, bs, color, createdAt: serverTimestamp() });
      }

      // Only settle bets belonging to the current user to ensure auth compliance
      const betsQuery = query(
        collection(db, 'bets'), 
        where('period', '==', period), 
        where('status', '==', 'pending'), 
        where('gameType', '==', 'wingo'),
        where('userId', '==', user.uid)
      );
      const betsSnap = await getDocs(betsQuery);
      if (betsSnap.empty) return;

      for (const betDoc of betsSnap.docs) {
        const bet = betDoc.data();
        let won = (bet.betType === bs) || color.includes(bet.betType.toLowerCase()) || (bet.betType === num.toString());
        if (won) {
          let multiplier = 1.9;
          if (bet.betType.toLowerCase() === 'violet') multiplier = 4.5;
          if (!isNaN(parseInt(bet.betType))) multiplier = 9;
          const payout = bet.amount * multiplier;
          
          updateDocumentNonBlocking(doc(db, 'bets', betDoc.id), { status: 'won', payout });
          updateDocumentNonBlocking(doc(db, 'users', user.uid), { 
            balance: increment(payout), 
            totalEarning: increment(payout - bet.amount) 
          });
          addDocumentNonBlocking(collection(db, 'transactions'), { 
            userId: user.uid, 
            type: 'win', 
            amount: payout, 
            description: `Win on ${bet.betType} (Wingo) for ${period}`, 
            timestamp: serverTimestamp() 
          });
        } else {
          updateDocumentNonBlocking(doc(db, 'bets', betDoc.id), { status: 'lost', payout: 0 });
        }
      }
    } catch (e) { console.error('Wingo Settle Error', e); }
  };

  const settleK3 = async (period: string) => {
    if (!db || !user) return;
    try {
      const resultRef = doc(db, 'k3_results', period);
      const resultSnap = await getDoc(resultRef);

      let dice: number[], sum: number, bs: string, oe: string;
      if (resultSnap.exists()) {
        const data = resultSnap.data();
        dice = data.dice; sum = data.sum; bs = data.bs; oe = data.oe;
      } else {
        dice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        sum = dice.reduce((a, b) => a + b, 0);
        bs = sum >= 11 ? 'Big' : 'Small';
        oe = sum % 2 === 0 ? 'Even' : 'Odd';
        await setDoc(resultRef, { period, dice, sum, bs, oe, createdAt: serverTimestamp() });
      }

      const betsQuery = query(
        collection(db, 'bets'), 
        where('period', '==', period), 
        where('gameType', '==', 'k3'), 
        where('status', '==', 'pending'),
        where('userId', '==', user.uid)
      );
      const betsSnap = await getDocs(betsQuery);
      if (betsSnap.empty) return;

      for (const betDoc of betsSnap.docs) {
        const bet = betDoc.data();
        let won = (bet.betType === bs || bet.betType === oe || bet.betType === sum.toString());
        if (won) {
          const payout = bet.amount * (K3_MULTIPLIERS[bet.betType] || 1.9);
          updateDocumentNonBlocking(doc(db, 'bets', betDoc.id), { status: 'won', payout });
          updateDocumentNonBlocking(doc(db, 'users', user.uid), { 
            balance: increment(payout), 
            totalEarning: increment(payout - bet.amount) 
          });
          addDocumentNonBlocking(collection(db, 'transactions'), { 
            userId: user.uid, 
            type: 'win', 
            amount: payout, 
            description: `Win on ${bet.betType} (K3) for ${period}`, 
            timestamp: serverTimestamp() 
          });
        } else {
          updateDocumentNonBlocking(doc(db, 'bets', betDoc.id), { status: 'lost', payout: 0 });
        }
      }
    } catch (e) { console.error('K3 Settle Error', e); }
  };

  const settleDT = async (period: string) => {
    if (!db || !user) return;
    try {
      const resultRef = doc(db, 'dragon_tiger_results', period);
      const resultSnap = await getDoc(resultRef);

      let winner: string, dragonCard: number, tigerCard: number;
      if (resultSnap.exists()) {
        const data = resultSnap.data();
        winner = data.winner; dragonCard = data.dragonCard; tigerCard = data.tigerCard;
      } else {
        dragonCard = Math.floor(Math.random() * 13) + 1;
        tigerCard = Math.floor(Math.random() * 13) + 1;
        if (dragonCard > tigerCard) winner = 'Dragon';
        else if (tigerCard > dragonCard) winner = 'Tiger';
        else winner = 'Tie';
        await setDoc(resultRef, { period, winner, dragonCard, tigerCard, createdAt: serverTimestamp() });
      }

      const betsQuery = query(
        collection(db, 'bets'), 
        where('period', '==', period), 
        where('gameType', '==', 'dragon_tiger'), 
        where('status', '==', 'pending'),
        where('userId', '==', user.uid)
      );
      const betsSnap = await getDocs(betsQuery);
      if (betsSnap.empty) return;

      for (const betDoc of betsSnap.docs) {
        const bet = betDoc.data();
        let won = bet.betType === winner;
        if (won) {
          const payout = bet.amount * (winner === 'Tie' ? 9 : 1.9);
          updateDocumentNonBlocking(doc(db, 'bets', betDoc.id), { status: 'won', payout });
          updateDocumentNonBlocking(doc(db, 'users', user.uid), { 
            balance: increment(payout), 
            totalEarning: increment(payout - bet.amount) 
          });
          addDocumentNonBlocking(collection(db, 'transactions'), { 
            userId: user.uid, 
            type: 'win', 
            amount: payout, 
            description: `Win on ${bet.betType} (DragonTiger) for ${period}`, 
            timestamp: serverTimestamp() 
          });
        } else {
          updateDocumentNonBlocking(doc(db, 'bets', betDoc.id), { status: 'lost', payout: 0 });
        }
      }
    } catch (e) { console.error('DT Settle Error', e); }
  };

  useEffect(() => {
    const tick = async () => {
      if (!db || !user) return;
      const now = new Date();
      const prevRoundTime = new Date(now.getTime() - (ROUND_TIME * 1000));
      const prevPeriod = generatePeriod(prevRoundTime);

      if (lastSettledWingo.current !== prevPeriod) {
        lastSettledWingo.current = prevPeriod;
        settleWingo(prevPeriod);
      }
      if (lastSettledK3.current !== prevPeriod) {
        lastSettledK3.current = prevPeriod;
        settleK3(prevPeriod);
      }
      if (lastSettledDT.current !== prevPeriod) {
        lastSettledDT.current = prevPeriod;
        settleDT(prevPeriod);
      }
    };

    const timer = setInterval(tick, 2000);
    tick();
    return () => clearInterval(timer);
  }, [generatePeriod, db, user]);

  return null;
}
