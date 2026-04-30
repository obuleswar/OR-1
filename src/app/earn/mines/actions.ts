'use server';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { getMinesMultiplier } from '@/lib/mines-logic';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function startMinesGame(userId: string, betAmount: number, bombCount: number) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists() || userSnap.data().balance < betAmount) {
      throw new Error('Insufficient balance');
    }

    // Generate bomb positions (0-24)
    const bombs: number[] = [];
    while (bombs.length < bombCount) {
      const pos = Math.floor(Math.random() * 25);
      if (!bombs.includes(pos)) bombs.push(pos);
    }

    const gameRef = doc(collection(db, 'mines_games'));
    const txnRef = doc(collection(db, 'transactions'));

    const batch = writeBatch(db);

    batch.set(gameRef, {
      userId,
      betAmount,
      bombCount,
      revealedIndices: [],
      bombPositions: bombs,
      status: 'active',
      payout: 0,
      createdAt: serverTimestamp()
    });

    batch.update(userRef, {
      balance: increment(-betAmount)
    });

    batch.set(txnRef, {
      userId,
      type: 'bet',
      amount: betAmount,
      description: `Mines Game Start (${bombCount} Bombs)`,
      timestamp: serverTimestamp()
    });

    await batch.commit();
    return { success: true, gameId: gameRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function revealMinesCell(gameId: string, userId: string, index: number) {
  try {
    const gameRef = doc(db, 'mines_games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) throw new Error('Game not found');
    const game = gameSnap.data();

    if (game.status !== 'active') throw new Error('Game already finished');
    if (game.revealedIndices.includes(index)) throw new Error('Cell already revealed');

    const isBomb = game.bombPositions.includes(index);
    const newRevealed = [...game.revealedIndices, index];

    if (isBomb) {
      // Game Over: Lost
      await setDoc(gameRef, {
        status: 'lost',
        revealedIndices: newRevealed
      }, { merge: true });
      return { success: true, result: 'bomb', bombPositions: game.bombPositions };
    } else {
      // Success: Gem
      await setDoc(gameRef, {
        revealedIndices: newRevealed
      }, { merge: true });
      
      const newMultiplier = getMinesMultiplier(game.bombCount, newRevealed.length);
      return { success: true, result: 'gem', multiplier: newMultiplier };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cashOutMines(gameId: string, userId: string) {
  try {
    const gameRef = doc(db, 'mines_games', gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) throw new Error('Game not found');
    const game = gameSnap.data();

    if (game.status !== 'active') throw new Error('Game already finished');
    if (game.revealedIndices.length === 0) throw new Error('No gems revealed yet');

    const multiplier = getMinesMultiplier(game.bombCount, game.revealedIndices.length);
    const payout = Math.floor(game.betAmount * multiplier);

    const batch = writeBatch(db);
    batch.update(gameRef, {
      status: 'won',
      payout
    });

    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      balance: increment(payout),
      totalEarning: increment(payout - game.betAmount)
    });

    batch.set(doc(collection(db, 'transactions')), {
      userId,
      type: 'win',
      amount: payout,
      description: `Mines Cash Out (${game.revealedIndices.length} Gems)`,
      timestamp: serverTimestamp()
    });

    await batch.commit();
    return { success: true, payout, bombPositions: game.bombPositions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
