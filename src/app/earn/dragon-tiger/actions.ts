
'use server';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function placeDragonTigerBet(userId: string, period: string, betType: string, amount: number) {
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
      gameType: 'dragon_tiger',
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
      description: `Bet on ${betType} in Dragon Tiger for period ${period}`,
      timestamp: serverTimestamp()
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function settleDragonTigerRound(period: string) {
  try {
    const resultRef = doc(db, 'dragon_tiger_results', period);
    const resultSnap = await getDoc(resultRef);

    let winner: string;
    let dragonCard: number;
    let tigerCard: number;

    if (resultSnap.exists()) {
      const data = resultSnap.data();
      winner = data.winner;
      dragonCard = data.dragonCard;
      tigerCard = data.tigerCard;
    } else {
      dragonCard = Math.floor(Math.random() * 13) + 1;
      tigerCard = Math.floor(Math.random() * 13) + 1;

      if (dragonCard > tigerCard) winner = 'Dragon';
      else if (tigerCard > dragonCard) winner = 'Tiger';
      else winner = 'Tie';

      await setDoc(resultRef, {
        period,
        winner,
        dragonCard,
        tigerCard,
        createdAt: serverTimestamp()
      });
    }

    const betsQuery = query(
      collection(db, 'bets'), 
      where('period', '==', period), 
      where('gameType', '==', 'dragon_tiger'),
      where('status', '==', 'pending')
    );
    const betsSnap = await getDocs(betsQuery);

    if (betsSnap.empty) {
      return { success: true, result: { winner, dragonCard, tigerCard } };
    }

    const batch = writeBatch(db);
    let batchSize = 0;

    for (const betDoc of betsSnap.docs) {
      const bet = betDoc.data();
      let won = bet.betType === winner;
      let payout = 0;

      if (won) {
        let multiplier = winner === 'Tie' ? 9 : 1.9;
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
          description: `Win on ${bet.betType} in Dragon Tiger for period ${period}`,
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

    return { success: true, result: { winner, dragonCard, tigerCard } };
  } catch (error: any) {
    console.error('Dragon Tiger Settlement Error:', error);
    return { success: false, error: error.message };
  }
}
