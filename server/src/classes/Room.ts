import { Server } from 'socket.io';
import { Player } from './Player';
import { Game } from './Game';
import { RoomSettings, PlayerData, RoomData } from '../types';

export class Room {
  public roomId: string;
  public hostId: string;
  public players: Map<string, Player>;
  public settings: RoomSettings;
  public game: Game | null;
  public createdAt: Date;
  public bannedIds: Set<string>;

  constructor(roomId: string, hostId: string, settings: Partial<RoomSettings> = {}) {
    this.roomId = roomId;
    this.hostId = hostId;
    this.players = new Map();
    this.game = null;
    this.createdAt = new Date();
    this.bannedIds = new Set();
    this.settings = {
      maxPlayers: Math.min(20, Math.max(2, settings.maxPlayers || 8)),
      rounds: Math.min(10, Math.max(2, settings.rounds || 3)),
      drawTime: Math.min(240, Math.max(15, settings.drawTime || 80)),
      wordCount: Math.min(5, Math.max(2, settings.wordCount || 3)),
      hints: Math.min(5, Math.max(0, settings.hints || 2)),
      wordMode: settings.wordMode || 'normal',
      isPrivate: settings.isPrivate ?? true,
    };
  }

  addPlayer(player: Player): void {
    if (this.players.size >= this.settings.maxPlayers) {
      throw new Error('Room is full');
    }
    if (this.bannedIds.has(player.id)) {
      throw new Error('You are banned from this room');
    }
    this.players.set(player.id, player);
  }

  removePlayer(id: string): void {
    this.players.delete(id);
  }

  banPlayer(id: string): void {
    this.bannedIds.add(id);
    this.removePlayer(id);
  }

  broadcast(io: Server, event: string, data: unknown): void {
    io.to(this.roomId).emit(event, data);
  }

  emitToPlayer(io: Server, playerId: string, event: string, data: unknown): void {
    io.to(playerId).emit(event, data);
  }

  getPlayers(): PlayerData[] {
    return [...this.players.values()].map(p => p.toJSON());
  }

  getPlayersSorted(): PlayerData[] {
    return this.getPlayers().sort((a, b) => b.score - a.score);
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  isGameActive(): boolean {
    return this.game !== null && this.game.isActive;
  }

  reassignHost(): void {
    if (this.isEmpty()) return;
    // Remove host from current
    this.players.forEach(p => { p.isHost = false; });
    const firstPlayer = [...this.players.values()][0];
    firstPlayer.isHost = true;
    this.hostId = firstPlayer.id;
  }

  updateSettings(newSettings: Partial<RoomSettings>): void {
    if (newSettings.maxPlayers !== undefined)
      this.settings.maxPlayers = Math.min(20, Math.max(2, newSettings.maxPlayers));
    if (newSettings.rounds !== undefined)
      this.settings.rounds = Math.min(10, Math.max(2, newSettings.rounds));
    if (newSettings.drawTime !== undefined)
      this.settings.drawTime = Math.min(240, Math.max(15, newSettings.drawTime));
    if (newSettings.wordCount !== undefined)
      this.settings.wordCount = Math.min(5, Math.max(2, newSettings.wordCount));
    if (newSettings.hints !== undefined)
      this.settings.hints = Math.min(5, Math.max(0, newSettings.hints));
    if (newSettings.wordMode !== undefined)
      this.settings.wordMode = newSettings.wordMode;
    if (newSettings.isPrivate !== undefined)
      this.settings.isPrivate = newSettings.isPrivate;
  }

  toJSON(): RoomData {
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      players: this.getPlayers(),
      settings: this.settings,
      isGameActive: this.isGameActive(),
    };
  }
}
