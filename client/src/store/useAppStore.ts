import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { PlayerData, RoomData, RoomSettings, GameState, ChatMessage, StrokeData } from '../types';

interface AppState {
  // Socket Connection
  socket: Socket | null;
  isConnected: boolean;
  connect: (url: string) => void;
  disconnect: () => void;

  // User State
  myId: string | null;
  myName: string | null;
  myAvatar: number;
  setUserInfo: (name: string, avatar: number) => void;

  // Room State
  roomId: string | null;
  roomSettings: RoomSettings | null;
  players: PlayerData[];
  hostId: string | null;
  isHost: boolean;
  publicRooms: RoomData[];
  setRoom: (data: Partial<RoomData>) => void;
  setPlayers: (players: PlayerData[]) => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;

  // Game State
  gameState: GameState;
  strokes: StrokeData[];
  chatMessages: ChatMessage[];
  setGameState: (state: Partial<GameState>) => void;
  addStroke: (stroke: StrokeData) => void;
  setStrokes: (strokes: StrokeData[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  // Error State
  error: string | null;
  setError: (err: string | null) => void;
}

const defaultGameState: GameState = {
  phase: 'lobby',
  round: 0,
  totalRounds: 3,
  drawerId: null,
  drawerName: null,
  hint: '',
  timeLeft: 0,
  totalTime: 80,
  word: null,
  wordOptions: null,
  players: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (url: string) => {
    const socket = get().socket;
    if (socket?.connected) return;

    const newSocket = io(url, {
      withCredentials: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => set({ isConnected: true, myId: newSocket.id || null }));
    newSocket.on('disconnect', () => set({ isConnected: false }));

    set({ socket: newSocket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, roomId: null, players: [] });
    }
  },

  myId: null,
  myName: null,
  myAvatar: 0,
  setUserInfo: (name, avatar) => set({ myName: name, myAvatar: avatar }),

  roomId: null,
  roomSettings: null,
  players: [],
  hostId: null,
  isHost: false,
  publicRooms: [],

  setRoom: (data) => set((state) => ({
    ...state,
    roomId: data.roomId !== undefined ? data.roomId : state.roomId,
    hostId: data.hostId !== undefined ? data.hostId : state.hostId,
    roomSettings: data.settings !== undefined ? data.settings : state.roomSettings,
    players: data.players !== undefined ? data.players : state.players,
    isHost: data.hostId === state.myId,
  })),

  setPlayers: (players) => set((state) => ({
    players,
    isHost: players.find(p => p.id === state.myId)?.isHost || false,
    hostId: players.find(p => p.isHost)?.id || null
  })),

  updateSettings: (settings) => set((state) => ({
    roomSettings: state.roomSettings ? { ...state.roomSettings, ...settings } : null
  })),

  gameState: defaultGameState,
  strokes: [],
  chatMessages: [],

  setGameState: (state) => set((prev) => ({
    gameState: { ...prev.gameState, ...state }
  })),

  addStroke: (stroke) => set((state) => ({
    strokes: [...state.strokes, stroke]
  })),

  setStrokes: (strokes) => set({ strokes }),

  addChatMessage: (msg) => set((state) => {
    // Keep max 100 messages
    const newMessages = [...state.chatMessages, msg];
    if (newMessages.length > 100) newMessages.shift();
    return { chatMessages: newMessages };
  }),

  clearChat: () => set({ chatMessages: [] }),

  error: null,
  setError: (error) => set({ error }),
}));
