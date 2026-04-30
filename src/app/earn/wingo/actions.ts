
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase for Server Side
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const ColorMap: Record<number, string[]> = {
  1: ['green'], 3: ['green'], 7: ['green'], 9: ['green'],
  2: ['red'], 4: ['red'], 6: ['red'], 8: ['red'],
  0: ['violet', 'red'],
  5: ['violet', 'green']
};

export async function placeBet(userId: string, period: string, betType: string, amount: number) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists() || userSnap.data().balance < amount) {
      throw new Error('Insufficient balance');
    }

    const betRef = doc(collection(db, 'bets'));
    const txnRef = doc(collection(db, 'transactions'));

    const batch = writeBatch(db);

    batch.set(betRef, {
      userId,
      period,
      gameType: 'wingo',
      betType,
      amount,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    batch.update(userRef, {
      balance: increment(-amount)
    });

    batch.set(txnRef, {
      userId,
      type: 'bet',
      amount,
      description: `Bet on ${betType} for period ${period}`,
      timestamp: serverTimestamp()
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function settleRound(period: string) {
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
      // Generate Result
      num = Math.floor(Math.random() * 10);
      bs = num >= 5 ? 'Big' : 'Small';
      color = ColorMap[num];

      await setDoc(resultRef, {
        period,
        num,
        bs,
        color,
        createdAt: serverTimestamp()
      });
    }

    // Payout Logic for all pending bets in this period
    const betsQuery = query(
      collection(db, 'bets'), 
      where('period', '==', period), 
      where('status', '==', 'pending'),
      where('gameType', '==', 'wingo')
    );
    const betsSnap = await getDocs(betsQuery);

    if (betsSnap.empty) {
      return { success: true, result: { num, bs, color } };
    }

    // Use a single batch for all updates in this settlement
    const batch = writeBatch(db);
    let batchSize = 0;

    for (const betDoc of betsSnap.docs) {
      const bet = betDoc.data();
      let payout = 0;
      let won = false;

      // Check win
      if (bet.betType === bs) won = true;
      if (color.includes(bet.betType.toLowerCase())) won = true;
      if (bet.betType === num.toString()) won = true;

      if (won) {
        // Multiplier logic
        let multiplier = 1.9;
        if (['violet'].includes(bet.betType.toLowerCase())) multiplier = 4.5;
        if (!isNaN(parseInt(bet.betType))) multiplier = 9;
        
        payout = bet.amount * multiplier;

        batch.update(doc(db, 'bets', betDoc.id), {
          status: 'won',
          payout
        });
        batch.update(doc(db, 'users', bet.userId), {
          balance: increment(payout),
          totalEarning: increment(payout - bet.amount)
        });
        batch.set(doc(collection(db, 'transactions')), {
          userId: bet.userId,
          type: 'win',
          amount: payout,
          description: `Win on ${bet.betType} for period ${period}`,
          timestamp: serverTimestamp()
        });
      } else {
        batch.update(doc(db, 'bets', betDoc.id), {
          status: 'lost',
          payout: 0
        });
      }
      
      batchSize++;
      // Commit every 400 operations to stay safe under 500 limit
      if (batchSize >= 400) {
        await batch.commit();
        batchSize = 0;
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }

    return { success: true, result: { num, bs, color } };
  } catch (error: any) {
    console.error('Settlement Error:', error);
    return { success: false, error: error.message };
  }
}
