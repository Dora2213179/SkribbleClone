import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Lobby } from '../components/room/Lobby';
import { DrawingCanvas } from '../components/room/DrawingCanvas';
import { ChatPanel } from '../components/room/ChatPanel';
import { PlayerList } from '../components/room/PlayerList';
import { GameHeader } from '../components/room/GameHeader';
import { WordChooser } from '../components/room/WordChooser';
import { GameOverlay } from '../components/room/GameOverlay';

export function Room() {
  const { roomId, isConnected, gameState } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected || !roomId) {
      navigate('/');
    }
  }, [isConnected, roomId, navigate]);

  // Show lobby when in lobby phase
  if (gameState.phase === 'lobby') {
    return <Lobby />;
  }

  // Game view
  return (
    <div className="min-h-screen flex flex-col p-2 md:p-4"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      
      {/* Game Header */}
      <div className="mb-2">
        <GameHeader />
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex gap-2 md:gap-3 min-h-0" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Left: Player List */}
        <div className="hidden md:block w-56 flex-shrink-0">
          <PlayerList />
        </div>

        {/* Center: Drawing Canvas */}
        <div className="flex-1 min-w-0">
          <DrawingCanvas />
        </div>

        {/* Right: Chat */}
        <div className="w-64 lg:w-72 flex-shrink-0">
          <ChatPanel />
        </div>
      </div>

      {/* Mobile Player List (below canvas) */}
      <div className="md:hidden mt-2">
        <div className="h-32">
          <PlayerList />
        </div>
      </div>

      {/* Overlays */}
      <WordChooser />
      <GameOverlay />
    </div>
  );
}
