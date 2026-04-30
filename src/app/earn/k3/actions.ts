
'use server';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function placeK3Bet(userId: string, period: string, betType: string, amount: number) {
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
      gameType: 'k3',
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
      description: `Bet on ${betType} in K3 for period ${period}`,
      timestamp: serverTimestamp()
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function settleK3Round(period: string) {
  try {
    const resultRef = doc(db, 'k3_results', period);
    const resultSnap = await getDoc(resultRef);

    let dice: number[];
    let sum: number;
    let bs: string;
    let oe: string;

    if (resultSnap.exists()) {
      const data = resultSnap.data();
      dice = data.dice;
      sum = data.sum;
      bs = data.bs;
      oe = data.oe;
    } else {
      dice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      sum = dice.reduce((a, b) => a + b, 0);
      bs = sum >= 11 ? 'Big' : 'Small';
      oe = sum % 2 === 0 ? 'Even' : 'Odd';

      await setDoc(resultRef, {
        period,
        dice,
        sum,
        bs,
        oe,
        createdAt: serverTimestamp()
      });
    }

    const betsQuery = query(
      collection(db, 'bets'), 
      where('period', '==', period), 
      where('gameType', '==', 'k3'),
      where('status', '==', 'pending')
    );
    const betsSnap = await getDocs(betsQuery);

    if (betsSnap.empty) {
      return { success: true, result: { dice, sum, bs, oe } };
    }

    const batch = writeBatch(db);
    let batchSize = 0;

    for (const betDoc of betsSnap.docs) {
      const bet = betDoc.data();
      let won = false;
      if (bet.betType === bs || bet.betType === oe) won = true;

      if (won) {
        const payout = bet.amount * 1.9;
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
          description: `Win on ${bet.betType} in K3 for period ${period}`,
          timestamp: serverTimestamp()
        });
      } else {
        batch.update(doc(db, 'bets', betDoc.id), {
          status: 'lost',
          payout: 0
        });
      }
      
      batchSize++;
      if (batchSize >= 400) {
        await batch.commit();
        batchSize = 0;
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }

    return { success: true, result: { dice, sum, bs, oe } };
  } catch (error: any) {
    console.error('K3 Settlement Error:', error);
    return { success: false, error: error.message };
  }
}
