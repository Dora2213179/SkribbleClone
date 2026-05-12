import { Room } from './Room';
import { RoomData, RoomSettings } from '../types';

export class RoomManager {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  createRoom(hostId: string, settings?: Partial<RoomSettings>): Room {
    const roomId = this.generateRoomId();
    const room = new Room(roomId, hostId, settings);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room?.game) {
      room.game.cleanup();
    }
    this.rooms.delete(roomId);
  }

  findRoomByPlayer(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    return undefined;
  }

  getPublicRooms(): RoomData[] {
    const publicRooms: RoomData[] = [];
    for (const room of this.rooms.values()) {
      if (!room.settings.isPrivate && !room.isGameActive() && room.players.size < room.settings.maxPlayers) {
        publicRooms.push(room.toJSON());
      }
    }
    return publicRooms;
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getPlayerCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.players.size;
    }
    return count;
  }

  cleanupEmptyRooms(): void {
    for (const [roomId, room] of this.rooms) {
      if (room.isEmpty()) {
        if (room.game) room.game.cleanup();
        this.rooms.delete(roomId);
      }
    }
  }

  private generateRoomId(): string {
    let id: string;
    do {
      id = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.rooms.has(id));
    return id;
  }
}
