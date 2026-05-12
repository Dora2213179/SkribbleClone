import { Server, Socket } from 'socket.io';
import { RoomManager } from '../classes/RoomManager';
import { Player } from '../classes/Player';
import { Game } from '../classes/Game';
import { CreateRoomPayload, JoinRoomPayload, RoomSettings } from '../types';

export class SocketHandler {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server) {
    this.io = io;
    this.roomManager = new RoomManager();
    this.setupConnection();

    // Periodic cleanup of empty rooms
    setInterval(() => {
      this.roomManager.cleanupEmptyRooms();
    }, 60000);
  }

  private setupConnection(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] Connected: ${socket.id}`);

      this.handleRoomEvents(socket);
      this.handleGameEvents(socket);
      this.handleDrawingEvents(socket);
      this.handleChatEvents(socket);
      this.handleDisconnect(socket);

      // Send server stats
      socket.emit('server_stats', {
        rooms: this.roomManager.getRoomCount(),
        players: this.roomManager.getPlayerCount(),
      });
    });
  }

  private handleRoomEvents(socket: Socket): void {
    // Create room
    socket.on('create_room', (data: CreateRoomPayload) => {
      try {
        const { hostName, avatar, settings } = data;
        if (!hostName || hostName.trim().length < 1 || hostName.trim().length > 20) {
          socket.emit('error_message', { message: 'Name must be 1-20 characters' });
          return;
        }

        const room = this.roomManager.createRoom(socket.id, settings);
        const player = new Player(socket.id, hostName.trim(), avatar || 0, true);
        room.addPlayer(player);
        socket.join(room.roomId);

        socket.emit('room_created', {
          roomId: room.roomId,
          player: player.toJSON(),
          players: room.getPlayers(),
          settings: room.settings,
        });

        console.log(`[Room] ${room.roomId} created by ${hostName}`);
      } catch (err: any) {
        socket.emit('error_message', { message: err.message });
      }
    });

    // Join room
    socket.on('join_room', (data: JoinRoomPayload) => {
      try {
        const { roomId, playerName, avatar } = data;
        if (!playerName || playerName.trim().length < 1 || playerName.trim().length > 20) {
          socket.emit('error_message', { message: 'Name must be 1-20 characters' });
          return;
        }

        const room = this.roomManager.getRoom(roomId?.toUpperCase());
        if (!room) {
          socket.emit('error_message', { message: 'Room not found. Check the code and try again.' });
          return;
        }
        if (room.players.size >= room.settings.maxPlayers) {
          socket.emit('error_message', { message: 'Room is full' });
          return;
        }
        if (room.isGameActive()) {
          socket.emit('error_message', { message: 'Game already in progress' });
          return;
        }

        const player = new Player(socket.id, playerName.trim(), avatar || 0);
        room.addPlayer(player);
        socket.join(room.roomId);

        socket.emit('joined_room', {
          roomId: room.roomId,
          player: player.toJSON(),
          players: room.getPlayers(),
          settings: room.settings,
        });

        socket.to(room.roomId).emit('player_joined', {
          player: player.toJSON(),
          players: room.getPlayers(),
        });

        console.log(`[Room] ${playerName} joined ${room.roomId}`);
      } catch (err: any) {
        socket.emit('error_message', { message: err.message });
      }
    });

    // Get public rooms
    socket.on('get_public_rooms', () => {
      socket.emit('public_rooms', { rooms: this.roomManager.getPublicRooms() });
    });

    // Update settings
    socket.on('update_settings', (data: { settings: Partial<RoomSettings> }) => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room || room.hostId !== socket.id) return;
      room.updateSettings(data.settings);
      room.broadcast(this.io, 'settings_updated', { settings: room.settings });
    });

    // Kick player
    socket.on('kick_player', (data: { playerId: string }) => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room || room.hostId !== socket.id) return;
      if (data.playerId === socket.id) return;

      const kicked = room.players.get(data.playerId);
      if (!kicked) return;

      this.io.to(data.playerId).emit('kicked', { message: 'You were kicked by the host' });
      const kickedSocket = this.io.sockets.sockets.get(data.playerId);
      if (kickedSocket) kickedSocket.leave(room.roomId);

      room.removePlayer(data.playerId);
      room.broadcast(this.io, 'player_left', {
        playerId: data.playerId,
        playerName: kicked.name,
        players: room.getPlayers(),
        reason: 'kicked',
      });
    });

    // Ban player
    socket.on('ban_player', (data: { playerId: string }) => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room || room.hostId !== socket.id) return;
      if (data.playerId === socket.id) return;

      const banned = room.players.get(data.playerId);
      if (!banned) return;

      this.io.to(data.playerId).emit('kicked', { message: 'You were banned by the host' });
      const bannedSocket = this.io.sockets.sockets.get(data.playerId);
      if (bannedSocket) bannedSocket.leave(room.roomId);

      room.banPlayer(data.playerId);
      room.broadcast(this.io, 'player_left', {
        playerId: data.playerId,
        playerName: banned.name,
        players: room.getPlayers(),
        reason: 'banned',
      });
    });
  }

  private handleGameEvents(socket: Socket): void {
    // Start game
    socket.on('start_game', () => {
      try {
        const room = this.roomManager.findRoomByPlayer(socket.id);
        if (!room) {
          socket.emit('error_message', { message: 'Room not found' });
          return;
        }
        if (room.hostId !== socket.id) {
          socket.emit('error_message', { message: 'Only the host can start the game' });
          return;
        }
        if (room.players.size < 2) {
          socket.emit('error_message', { message: 'Need at least 2 players' });
          return;
        }

        room.players.forEach(p => p.resetGame());
        room.game = new Game(room, this.io);
        room.game.startGame();

        console.log(`[Game] Started in room ${room.roomId}`);
      } catch (err: any) {
        socket.emit('error_message', { message: err.message });
      }
    });

    // Word chosen
    socket.on('word_chosen', (data: { word: string }) => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room?.game || room.game.currentDrawer !== socket.id) return;
      if (room.game.phase !== 'choosing') return;
      room.game.chooseWord(data.word);
    });

    // Play again
    socket.on('play_again', () => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room) return;

      room.game = null;
      room.players.forEach(p => p.resetGame());
      room.broadcast(this.io, 'back_to_lobby', {
        players: room.getPlayers(),
        settings: room.settings,
      });
    });
  }

  private handleDrawingEvents(socket: Socket): void {
    socket.on('draw_start', (data) => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room?.game || room.game.currentDrawer !== socket.id) return;
      if (room.game.phase !== 'drawing') return;

      const strokeData = { type: 'start' as const, ...data };
      room.game.addStroke(strokeData);
      socket.to(room.roomId).emit('draw_data', strokeData);
    });

    socket.on('draw_fill', (data) => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room?.game || room.game.currentDrawer !== socket.id) return;
      if (room.game.phase !== 'drawing') return;

      const strokeData = { type: 'fill' as const, ...data };
      room.game.addStroke(strokeData);
      socket.to(room.roomId).emit('draw_data', strokeData);
    });

    socket.on('draw_move', (data) => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room?.game || room.game.currentDrawer !== socket.id) return;
      if (room.game.phase !== 'drawing') return;

      const strokeData = { type: 'move' as const, ...data };
      room.game.addStroke(strokeData);
      socket.to(room.roomId).emit('draw_data', strokeData);
    });

    socket.on('draw_end', () => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room?.game || room.game.currentDrawer !== socket.id) return;

      const strokeData = { type: 'end' as const };
      room.game.addStroke(strokeData);
      socket.to(room.roomId).emit('draw_data', strokeData);
    });

    socket.on('draw_undo', () => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room?.game || room.game.currentDrawer !== socket.id) return;
      room.game.undoLastStroke();
    });

    socket.on('canvas_clear', () => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room?.game || room.game.currentDrawer !== socket.id) return;
      room.game.clearStrokes();
    });
  }

  private handleChatEvents(socket: Socket): void {
    socket.on('guess', (data: { text: string }) => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      const text = data.text?.trim();
      if (!text || text.length > 100) return;

      if (room.game?.isActive && !player.isDrawing && room.game.phase === 'drawing' && !player.hasGuessed) {
        const isCorrect = room.game.checkGuess(socket.id, text);

        if (isCorrect) {
          room.broadcast(this.io, 'chat_message', {
            id: Date.now().toString() + socket.id,
            playerId: socket.id,
            playerName: player.name,
            text: `${player.name} guessed the word! 🎉`,
            type: 'correct',
            timestamp: Date.now(),
          });
        } else {
          room.broadcast(this.io, 'chat_message', {
            id: Date.now().toString() + socket.id,
            playerId: socket.id,
            playerName: player.name,
            text,
            type: 'guess',
            timestamp: Date.now(),
          });
        }
      } else {
        // Regular chat or already guessed
        room.broadcast(this.io, 'chat_message', {
          id: Date.now().toString() + socket.id,
          playerId: socket.id,
          playerName: player.name,
          text,
          type: player.hasGuessed ? 'chat' : 'chat',
          timestamp: Date.now(),
        });
      }
    });
  }

  private handleDisconnect(socket: Socket): void {
    socket.on('disconnect', () => {
      const room = this.roomManager.findRoomByPlayer(socket.id);
      if (!room) return;

      const player = room.players.get(socket.id);
      const wasDrawing = player?.isDrawing || false;
      const playerName = player?.name || 'Unknown';

      room.removePlayer(socket.id);

      if (room.isEmpty()) {
        if (room.game) room.game.cleanup();
        this.roomManager.deleteRoom(room.roomId);
        console.log(`[Room] ${room.roomId} deleted (empty)`);
        return;
      }

      room.reassignHost();

      room.broadcast(this.io, 'player_left', {
        playerId: socket.id,
        playerName,
        players: room.getPlayers(),
        reason: 'disconnect',
      });

      room.broadcast(this.io, 'chat_message', {
        id: Date.now().toString(),
        playerId: 'system',
        playerName: 'System',
        text: `${playerName} left the game`,
        type: 'system',
        timestamp: Date.now(),
      });

      if (wasDrawing && room.game?.isActive) {
        room.game.handleDrawerDisconnect();
      } else if (room.game?.isActive && room.players.size < 2) {
        room.game.endGame();
      }

      console.log(`[Socket] Disconnected: ${socket.id} (${playerName})`);
    });
  }
}
