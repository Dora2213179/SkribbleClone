import { Player } from './Player';

export class ScoreManager {
  /**
   * Calculate guesser points based on time remaining and guess order.
   * Faster guesses get more points. First guesser gets max bonus.
   */
  static calculateGuesserPoints(
    timeLeft: number,
    totalTime: number,
    guessOrder: number
  ): number {
    // Base points: 50-100 based on time remaining
    const timeRatio = timeLeft / totalTime;
    const basePoints = Math.round(50 + timeRatio * 50);
    
    // Order penalty: -5 for each subsequent guesser
    const orderPenalty = (guessOrder - 1) * 5;
    
    return Math.max(10, basePoints - orderPenalty);
  }

  /**
   * Calculate drawer bonus based on number of correct guessers.
   */
  static calculateDrawerPoints(correctGuessers: number, totalGuessers: number): number {
    if (correctGuessers === 0) return 0;
    // Drawer gets points proportional to how many guessed correctly
    const ratio = correctGuessers / totalGuessers;
    return Math.round(10 + ratio * 40);
  }

  /**
   * Get sorted leaderboard from players.
   */
  static getLeaderboard(players: Player[]): Player[] {
    return [...players].sort((a, b) => b.score - a.score);
  }

  /**
   * Get rank position (1-indexed) for a player.
   */
  static getPlayerRank(players: Player[], playerId: string): number {
    const sorted = this.getLeaderboard(players);
    return sorted.findIndex(p => p.id === playerId) + 1;
  }
}
