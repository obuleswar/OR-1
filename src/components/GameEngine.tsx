'use client';

import { useEffect, useCallback, useRef } from 'react';
import { settleRound } from '@/app/earn/wingo/actions';
import { settleK3Round } from '@/app/earn/k3/actions';
import { settleDragonTigerRound } from '@/app/earn/dragon-tiger/actions';

const ROUND_TIME = 60;

export function GameEngine() {
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

  useEffect(() => {
    const tick = async () => {
      const now = new Date();
      const currentPeriod = generatePeriod(now);
      
      // Calculate previous period to settle
      const prevRoundTime = new Date(now.getTime() - (ROUND_TIME * 1000));
      const prevPeriod = generatePeriod(prevRoundTime);

      // Settle Wingo
      if (lastSettledWingo.current !== prevPeriod) {
        lastSettledWingo.current = prevPeriod;
        settleRound(prevPeriod).catch(() => {});
      }

      // Settle K3
      if (lastSettledK3.current !== prevPeriod) {
        lastSettledK3.current = prevPeriod;
        settleK3Round(prevPeriod).catch(() => {});
      }

      // Settle Dragon Tiger
      if (lastSettledDT.current !== prevPeriod) {
        lastSettledDT.current = prevPeriod;
        settleDragonTigerRound(prevPeriod).catch(() => {});
      }
    };

    const timer = setInterval(tick, 2000); // Check every 2 seconds
    tick(); // Initial check

    return () => clearInterval(timer);
  }, [generatePeriod]);

  return null; // This component doesn't render anything
}
