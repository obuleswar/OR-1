/**
 * @fileOverview Shared logic for the Mines game.
 */

/**
 * Calculates the current multiplier for a Mines game based on the number of bombs and revealed gems.
 * 
 * @param bombCount The total number of bombs in the 5x5 grid.
 * @param revealedCount The number of gems successfully revealed by the player.
 * @returns A number representing the payout multiplier (e.g., 1.45).
 */
export function getMinesMultiplier(bombCount: number, revealedCount: number): number {
  if (revealedCount === 0) return 1;
  const totalCells = 25;
  const gemCount = totalCells - bombCount;
  
  // Probability of picking n gems in a row
  // P = (G / T) * ((G-1) / (T-1)) * ... * ((G-n+1) / (T-n+1))
  let prob = 1;
  for (let i = 0; i < revealedCount; i++) {
    // Avoid division by zero or negative results just in case
    const currentGemCount = gemCount - i;
    const currentTotalCells = totalCells - i;
    if (currentTotalCells <= 0 || currentGemCount <= 0) break;
    
    prob *= currentGemCount / currentTotalCells;
  }
  
  // House edge ~ 3% (return to player 97%)
  const multiplier = (1 / prob) * 0.97;
  return parseFloat(multiplier.toFixed(2));
}

// Factorial calculation for combinations (keeping as utility if needed elsewhere)
export function factorial(n: number): number {
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  return factorial(n) / (factorial(k) * factorial(n - k));
}
