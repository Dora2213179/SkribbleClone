import { Server } from 'socket.io';
import { Room } from './Room';
import { WordManager } from './WordManager';
import { ScoreManager } from './ScoreManager';
import { StrokeData, GamePhase } from '../types';

export class Game {
  public room: Room;
  public io: Server;
  public currentRound: number;
  public currentDrawerIndex: number;
  public drawerOrder: string[];
  public currentWord: string | null;
  public currentDrawer: string | null;
  public timer: ReturnType<typeof setInterval> | null;
  public timeLeft: number;
  public totalTime: number;
  public strokes: StrokeData[];
  public guessOrder: number;
  public hintTimer: ReturnType<typeof setInterval> | null;
  public revealedIndices: Set<number>;
  public wordChoiceTimeout: ReturnType<typeof setTimeout> | null;
  public roundEndTimeout: ReturnType<typeof setTimeout> | null;
  public isActive: boolean;
  public phase: GamePhase;
  public wordManager: WordManager;
  private correctGuessersThisTurn: number;

  constructor(room: Room, io: Server) {
    this.room = room;
    this.io = io;
    this.currentRound = 0;
    this.currentDrawerIndex = 0;
    this.drawerOrder = [];
    this.currentWord = null;
    this.currentDrawer = null;
    this.timer = null;
    this.timeLeft = 0;
    this.totalTime = room.settings.drawTime;
    this.strokes = [];
    this.guessOrder = 0;
    this.hintTimer = null;
    this.revealedIndices = new Set();
    this.wordChoiceTimeout = null;
    this.roundEndTimeout = null;
    this.isActive = true;
    this.phase = 'lobby';
    this.wordManager = new WordManager();
    this.correctGuessersThisTurn = 0;
  }

  startGame(): void {
    const playerIds = [...this.room.players.keys()];
    // Fisher-Yates shuffle
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    this.drawerOrder = playerIds;
    this.currentRound = 1;
    this.currentDrawerIndex = 0;

    this.room.broadcast(this.io, 'game_started', {
      round: this.currentRound,
      totalRounds: this.room.settings.rounds,
      players: this.room.getPlayers(),
    });

    setTimeout(() => this.startTurn(), 1500);
  }

  startTurn(): void {
    if (!this.isActive) return;

    // Reset all players for this turn
    this.room.players.forEach(p => p.resetRound());

    // Get current drawer
    const drawerId = this.drawerOrder[this.currentDrawerIndex];
    const drawer = this.room.players.get(drawerId);

    if (!drawer) {
      this.advanceToNextDrawer();
      return;
    }

    drawer.isDrawing = true;
    this.currentDrawer = drawerId;
    this.strokes = [];
    this.guessOrder = 0;
    this.correctGuessersThisTurn = 0;
    this.revealedIndices = new Set();
    this.phase = 'choosing';

    const wordOptions = this.wordManager.getRandomWords(this.room.settings.wordCount);

    // Send round start - drawer gets word options, others don't
    this.room.players.forEach((player) => {
      this.io.to(player.id).emit('round_start', {
        drawerId,
        drawerName: drawer.name,
        wordOptions: player.id === drawerId ? wordOptions : null,
        drawTime: this.room.settings.drawTime,
        round: this.currentRound,
        totalRounds: this.room.settings.rounds,
        players: this.room.getPlayers(),
      });
    });

    // 15 second word choice timeout
    this.wordChoiceTimeout = setTimeout(() => {
      if (this.phase === 'choosing' && this.isActive) {
        this.chooseWord(wordOptions[0]);
      }
    }, 15000);
  }

  chooseWord(word: string): void {
    if (this.wordChoiceTimeout) {
      clearTimeout(this.wordChoiceTimeout);
      this.wordChoiceTimeout = null;
    }

    this.currentWord = word;
    this.guessOrder = 0;
    this.correctGuessersThisTurn = 0;
    this.revealedIndices = new Set();
    this.strokes = [];
    this.timeLeft = this.room.settings.drawTime;
    this.totalTime = this.room.settings.drawTime;
    this.phase = 'drawing';

    const hint = this.buildHint();

    // Send word to drawer, hint to others
    this.room.players.forEach(player => {
      this.io.to(player.id).emit('word_chosen_update', {
        word: player.id === this.currentDrawer ? this.currentWord : null,
        hint,
        timeLeft: this.timeLeft,
        totalTime: this.totalTime,
        phase: 'drawing' as GamePhase,
      });
    });

    this.startTimer();
    this.startHintReveal();
  }

  buildHint(): string {
    if (!this.currentWord) return '';
    return this.currentWord
      .split('')
      .map((ch, i) => {
        if (ch === ' ') return '  ';
        if (this.revealedIndices.has(i)) return ch;
        return '_';
      })
      .join('');
  }

  startTimer(): void {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (!this.isActive) {
        if (this.timer) clearInterval(this.timer);
        return;
      }

      this.timeLeft--;

      this.room.broadcast(this.io, 'timer_tick', {
        timeLeft: this.timeLeft,
        totalTime: this.totalTime,
      });

      if (this.timeLeft <= 0) {
        this.endTurn();
      }
    }, 1000);
  }

  startHintReveal(): void {
    if (this.hintTimer) clearInterval(this.hintTimer);

    const hints = this.room.settings.hints;
    if (hints <= 0 || !this.currentWord) return;

    const interval = Math.floor((this.room.settings.drawTime / (hints + 1)) * 1000);

    this.hintTimer = setInterval(() => {
      if (this.phase !== 'drawing' || !this.currentWord) {
        if (this.hintTimer) clearInterval(this.hintTimer);
        return;
      }

      const unrevealed: number[] = [];
      for (let i = 0; i < this.currentWord.length; i++) {
        if (this.currentWord[i] !== ' ' && !this.revealedIndices.has(i)) {
          unrevealed.push(i);
        }
      }

      if (unrevealed.length <= 1) {
        if (this.hintTimer) clearInterval(this.hintTimer);
        return;
      }

      const randomIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      this.revealedIndices.add(randomIdx);

      const hint = this.buildHint();
      this.room.broadcast(this.io, 'hint_update', { hint });
    }, interval);
  }

  checkGuess(playerId: string, text: string): boolean {
    if (!this.currentWord || this.phase !== 'drawing') return false;

    const player = this.room.players.get(playerId);
    if (!player || player.hasGuessed || player.isDrawing) return false;
    if (!player.canGuess()) return false;

    const guess = text.trim().toLowerCase();
    const answer = this.currentWord.trim().toLowerCase();

    if (guess === answer) {
      this.guessOrder++;
      this.correctGuessersThisTurn++;

      const points = ScoreManager.calculateGuesserPoints(
        this.timeLeft,
        this.totalTime,
        this.guessOrder
      );

      player.addScore(points);
      player.hasGuessed = true;

      // Drawer bonus per correct guess
      const drawerPlayer = this.currentDrawer ? this.room.players.get(this.currentDrawer) : null;
      if (drawerPlayer) {
        drawerPlayer.addScore(10);
      }

      this.room.broadcast(this.io, 'guess_result', {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points,
        players: this.room.getPlayers(),
      });

      // Check if all non-drawers have guessed
      let allGuessed = true;
      this.room.players.forEach(p => {
        if (!p.isDrawing && !p.hasGuessed) {
          allGuessed = false;
        }
      });

      if (allGuessed) {
        this.endTurn();
      }

      return true;
    }

    // Close guess detection
    const isClose = this.isCloseGuess(guess, answer);
    if (isClose) {
      this.io.to(playerId).emit('guess_result', {
        correct: false,
        playerId: player.id,
        playerName: player.name,
        isClose: true,
      });
    }

    return false;
  }

  private isCloseGuess(guess: string, answer: string): boolean {
    if (Math.abs(guess.length - answer.length) > 2) return false;
    let diff = 0;
    const maxLen = Math.max(guess.length, answer.length);
    for (let i = 0; i < maxLen; i++) {
      if (guess[i] !== answer[i]) diff++;
    }
    return diff <= 2 && diff > 0;
  }

  endTurn(): void {
    if (this.phase === 'roundEnd' || this.phase === 'gameOver') return;
    this.phase = 'roundEnd';
    this.clearTimers();

    // Award drawer final bonus
    const drawerPlayer = this.currentDrawer ? this.room.players.get(this.currentDrawer) : null;
    if (drawerPlayer && this.correctGuessersThisTurn > 0) {
      const nonDrawerCount = this.room.players.size - 1;
      const bonusPoints = ScoreManager.calculateDrawerPoints(
        this.correctGuessersThisTurn,
        nonDrawerCount
      );
      // Bonus already partially given per-guess, this is the remainder
      if (bonusPoints > this.correctGuessersThisTurn * 10) {
        drawerPlayer.addScore(bonusPoints - this.correctGuessersThisTurn * 10);
      }
    }

    // Determine next drawer info
    let nextDrawerIndex = this.currentDrawerIndex + 1;
    let nextRound = this.currentRound;
    if (nextDrawerIndex >= this.drawerOrder.length) {
      nextDrawerIndex = 0;
      nextRound++;
    }

    let nextDrawerName = '';
    if (nextRound <= this.room.settings.rounds) {
      const nextDrawerId = this.drawerOrder[nextDrawerIndex];
      const nextDrawer = this.room.players.get(nextDrawerId);
      nextDrawerName = nextDrawer ? nextDrawer.name : '';
    }

    this.room.broadcast(this.io, 'round_end', {
      word: this.currentWord,
      players: this.room.getPlayers(),
      nextDrawerName,
      round: this.currentRound,
      totalRounds: this.room.settings.rounds,
      isLastRound: nextRound > this.room.settings.rounds,
    });

    this.roundEndTimeout = setTimeout(() => {
      this.advanceToNextDrawer();
    }, 5000);
  }

  advanceToNextDrawer(): void {
    this.currentDrawerIndex++;

    if (this.currentDrawerIndex >= this.drawerOrder.length) {
      this.currentDrawerIndex = 0;
      this.currentRound++;
    }

    if (this.currentRound > this.room.settings.rounds) {
      this.endGame();
    } else {
      this.startTurn();
    }
  }

  endGame(): void {
    this.phase = 'gameOver';
    this.isActive = false;
    this.cleanup();

    const sortedPlayers = this.room.getPlayersSorted();

    this.room.broadcast(this.io, 'game_over', {
      winner: sortedPlayers[0] || null,
      leaderboard: sortedPlayers,
    });

    this.room.game = null;
  }

  addStroke(data: StrokeData): void {
    this.strokes.push(data);
  }

  undoLastStroke(): void {
    let foundEnd = false;
    while (this.strokes.length > 0) {
      const last = this.strokes[this.strokes.length - 1];
      if (last.type === 'start' && foundEnd) {
        this.strokes.pop();
        break;
      }
      if (last.type === 'end') foundEnd = true;
      if (last.type === 'start' && !foundEnd) {
        this.strokes.pop();
        break;
      }
      this.strokes.pop();
    }
    this.room.broadcast(this.io, 'undo_data', { strokes: this.strokes });
  }

  clearStrokes(): void {
    this.strokes = [];
    this.room.broadcast(this.io, 'canvas_cleared', {});
  }

  handleDrawerDisconnect(): void {
    if (this.phase === 'choosing' || this.phase === 'drawing') {
      this.clearTimers();
      if (this.room.players.size < 2) {
        this.endGame();
      } else {
        // Remove disconnected drawer from order
        this.drawerOrder = this.drawerOrder.filter(id => this.room.players.has(id));
        if (this.currentDrawerIndex >= this.drawerOrder.length) {
          this.currentDrawerIndex = 0;
          this.currentRound++;
        }
        if (this.currentRound > this.room.settings.rounds) {
          this.endGame();
        } else {
          this.phase = 'roundEnd';
          this.room.broadcast(this.io, 'round_end', {
            word: this.currentWord || '???',
            players: this.room.getPlayers(),
            nextDrawerName: '',
            round: this.currentRound,
            totalRounds: this.room.settings.rounds,
            isLastRound: false,
          });
          this.roundEndTimeout = setTimeout(() => this.startTurn(), 3000);
        }
      }
    }
  }

  private clearTimers(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.hintTimer) { clearInterval(this.hintTimer); this.hintTimer = null; }
    if (this.wordChoiceTimeout) { clearTimeout(this.wordChoiceTimeout); this.wordChoiceTimeout = null; }
  }

  cleanup(): void {
    this.clearTimers();
    if (this.roundEndTimeout) { clearTimeout(this.roundEndTimeout); this.roundEndTimeout = null; }
  }
}
