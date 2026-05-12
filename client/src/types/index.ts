export interface PlayerData {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
  avatar: number;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hints: number;
  wordMode: 'normal' | 'hidden' | 'combination';
  isPrivate: boolean;
}

export interface RoomData {
  roomId: string;
  hostId: string;
  players: PlayerData[];
  settings: RoomSettings;
  isGameActive: boolean;
}

export type GamePhase = 'lobby' | 'choosing' | 'drawing' | 'roundEnd' | 'gameOver';

export interface GameState {
  phase: GamePhase;
  round: number;
  totalRounds: number;
  drawerId: string | null;
  drawerName: string | null;
  hint: string;
  timeLeft: number;
  totalTime: number;
  word: string | null;
  wordOptions: string[] | null;
  players: PlayerData[];
}

export interface StrokeData {
  type: 'start' | 'move' | 'end' | 'fill';
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  tool?: 'brush' | 'eraser';
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: 'chat' | 'guess' | 'correct' | 'system' | 'close';
  timestamp: number;
}
