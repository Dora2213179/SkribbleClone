// ===== Shared Types for Skribbl Clone =====

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

export interface ScoreChange {
  playerId: string;
  playerName: string;
  points: number;
  total: number;
}

// ===== Socket Event Payloads =====

export interface CreateRoomPayload {
  hostName: string;
  avatar: number;
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  avatar: number;
}

export interface RoomCreatedPayload {
  roomId: string;
  player: PlayerData;
  players: PlayerData[];
  settings: RoomSettings;
}

export interface JoinedRoomPayload {
  roomId: string;
  player: PlayerData;
  players: PlayerData[];
  settings: RoomSettings;
}

export interface RoundStartPayload {
  drawerId: string;
  drawerName: string;
  wordOptions: string[] | null;
  drawTime: number;
  round: number;
  totalRounds: number;
  players: PlayerData[];
}

export interface WordChosenPayload {
  hint: string;
  timeLeft: number;
  phase: GamePhase;
  word: string | null;
}

export interface GuessResultPayload {
  correct: boolean;
  playerId: string;
  playerName: string;
  points?: number;
  isClose?: boolean;
  players?: PlayerData[];
}

export interface RoundEndPayload {
  word: string;
  players: PlayerData[];
  nextDrawerName: string;
  round: number;
  totalRounds: number;
  isLastRound: boolean;
}

export interface GameOverPayload {
  winner: PlayerData | null;
  leaderboard: PlayerData[];
  matchId?: string;
}

export interface TimerTickPayload {
  timeLeft: number;
  totalTime: number;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}
