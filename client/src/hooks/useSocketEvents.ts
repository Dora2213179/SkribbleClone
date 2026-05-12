import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/useAppStore';

export function useSocketEvents() {
  const { socket, setRoom, setPlayers, setGameState, addChatMessage, setStrokes, addStroke, setError, updateSettings } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // Room events
    socket.on('room_created', (data) => {
      setRoom({
        roomId: data.roomId,
        settings: data.settings,
        players: data.players,
        hostId: data.players.find((p: any) => p.isHost)?.id,
      });
      navigate(`/room/${data.roomId}`);
      toast.success('Room created successfully!');
    });

    socket.on('joined_room', (data) => {
      setRoom({
        roomId: data.roomId,
        settings: data.settings,
        players: data.players,
        hostId: data.players.find((p: any) => p.isHost)?.id,
      });
      navigate(`/room/${data.roomId}`);
      toast.success('Joined room!');
    });

    socket.on('player_joined', (data) => {
      setPlayers(data.players);
      addChatMessage({
        id: Date.now().toString() + Math.random(),
        playerId: 'system',
        playerName: 'System',
        text: `${data.player.name} joined the room`,
        type: 'system',
        timestamp: Date.now(),
      });
    });

    socket.on('player_left', (data) => {
      setPlayers(data.players);
      addChatMessage({
        id: Date.now().toString() + Math.random(),
        playerId: 'system',
        playerName: 'System',
        text: `${data.playerName} left the room`,
        type: 'system',
        timestamp: Date.now(),
      });
    });

    socket.on('kicked', (data) => {
      toast.error(data.message || 'You were removed from the room');
      navigate('/');
    });

    socket.on('settings_updated', (data) => {
      updateSettings(data.settings);
    });

    // Game events
    socket.on('game_started', (data) => {
      setGameState({
        phase: 'choosing', // Initially transitions to choosing
        round: data.round,
        totalRounds: data.totalRounds,
      });
    });

    socket.on('round_start', (data) => {
      setGameState({
        phase: 'choosing',
        drawerId: data.drawerId,
        drawerName: data.drawerName,
        wordOptions: data.wordOptions,
        timeLeft: data.drawTime,
        totalTime: data.drawTime,
        round: data.round,
        totalRounds: data.totalRounds,
        players: data.players,
        word: null,
        hint: '',
      });
      setStrokes([]); // Clear canvas
      setPlayers(data.players);
    });

    socket.on('word_chosen_update', (data) => {
      setGameState({
        phase: data.phase,
        word: data.word,
        hint: data.hint,
        timeLeft: data.timeLeft,
        totalTime: data.totalTime,
      });
      setStrokes([]);
    });

    socket.on('timer_tick', (data) => {
      setGameState({
        timeLeft: data.timeLeft,
        totalTime: data.totalTime,
      });
    });

    socket.on('hint_update', (data) => {
      setGameState({ hint: data.hint });
    });

    socket.on('guess_result', (data) => {
      if (data.players) {
        setPlayers(data.players); // Update scores
      }
      if (data.correct && data.playerId === socket.id) {
        toast.success(`You guessed the word! +${data.points} points`);
      } else if (data.isClose && data.playerId === socket.id) {
        toast.error(`'${data.guess || 'Your guess'}' is close!`, { icon: '👀' });
      }
    });

    socket.on('round_end', (data) => {
      setGameState({
        phase: 'roundEnd',
        word: data.word,
        players: data.players,
        round: data.round,
        totalRounds: data.totalRounds,
      });
      setPlayers(data.players);
    });

    socket.on('game_over', (data) => {
      setGameState({
        phase: 'gameOver',
        players: data.leaderboard,
      });
      setPlayers(data.leaderboard);
    });

    socket.on('back_to_lobby', (data) => {
      setGameState({ phase: 'lobby' });
      setPlayers(data.players);
      updateSettings(data.settings);
    });

    // Chat events
    socket.on('chat_message', (data) => {
      addChatMessage(data);
    });

    // Drawing events
    socket.on('draw_data', (data) => {
      addStroke(data);
    });

    socket.on('undo_data', (data) => {
      setStrokes(data.strokes);
    });

    socket.on('canvas_cleared', () => {
      setStrokes([]);
    });

    // Error
    socket.on('error_message', (data) => {
      setError(data.message);
      toast.error(data.message);
    });

    return () => {
      socket.off('room_created');
      socket.off('joined_room');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('kicked');
      socket.off('settings_updated');
      socket.off('game_started');
      socket.off('round_start');
      socket.off('word_chosen_update');
      socket.off('timer_tick');
      socket.off('hint_update');
      socket.off('guess_result');
      socket.off('round_end');
      socket.off('game_over');
      socket.off('back_to_lobby');
      socket.off('chat_message');
      socket.off('draw_data');
      socket.off('undo_data');
      socket.off('canvas_cleared');
      socket.off('error_message');
    };
  }, [socket, setRoom, setPlayers, setGameState, addChatMessage, setStrokes, addStroke, setError, updateSettings, navigate]);
}
