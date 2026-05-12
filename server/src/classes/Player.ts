import { PlayerData } from '../types';

export class Player {
  public id: string;
  public name: string;
  public score: number;
  public isHost: boolean;
  public isDrawing: boolean;
  public hasGuessed: boolean;
  public avatar: number;
  private lastGuessTime: number;

  constructor(id: string, name: string, avatar: number = 0, isHost: boolean = false) {
    this.id = id;
    this.name = name;
    this.score = 0;
    this.isHost = isHost;
    this.isDrawing = false;
    this.hasGuessed = false;
    this.avatar = avatar;
    this.lastGuessTime = 0;
  }

  addScore(points: number): void {
    this.score += points;
  }

  resetRound(): void {
    this.hasGuessed = false;
    this.isDrawing = false;
  }

  resetGame(): void {
    this.score = 0;
    this.hasGuessed = false;
    this.isDrawing = false;
  }

  canGuess(): boolean {
    const now = Date.now();
    if (now - this.lastGuessTime < 500) return false; // Rate limit: 1 guess per 500ms
    this.lastGuessTime = now;
    return true;
  }

  toJSON(): PlayerData {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isHost: this.isHost,
      isDrawing: this.isDrawing,
      hasGuessed: this.hasGuessed,
      avatar: this.avatar,
    };
  }
}
