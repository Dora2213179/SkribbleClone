import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function Lobby() {
  const { socket, players, roomId, roomSettings, isHost, myId } = useAppStore();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleStartGame = () => {
    if (!socket || !isHost) return;
    socket.emit('start_game');
  };

  const handleSettingChange = (key: string, value: number | boolean | string) => {
    if (!socket || !isHost) return;
    socket.emit('update_settings', { settings: { [key]: value } });
  };

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (roomId) {
      const link = `${window.location.origin}/?room=${roomId}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleKick = (playerId: string) => {
    if (!socket || !isHost || playerId === myId) return;
    socket.emit('kick_player', { playerId });
  };

  const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
    '#A3E4D7', '#FAD7A0', '#A9CCE3', '#D5F5E3', '#FADBD8',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      
      <div className="w-full max-w-2xl animate-slideUp">
        {/* Room Code Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-center">
            <h1 className="text-3xl font-black text-white mb-2">
              🎨 Game Lobby
            </h1>
            <div className="flex flex-col items-center justify-center gap-3 mt-4">
              <div className="flex items-center gap-3">
                <span className="text-white/80 font-semibold">Room Code:</span>
                <button
                  onClick={handleCopyCode}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-black text-2xl tracking-[0.3em] px-6 py-2 rounded-xl transition-all hover:scale-105 active:scale-100"
                >
                  {roomId}
                </button>
                <button
                  onClick={handleCopyCode}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap"
                >
                  {copiedCode ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
              <button
                onClick={handleCopyLink}
                className="bg-green-500/80 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md mt-1"
              >
                {copiedLink ? '✅ Link Copied!' : '🔗 Copy Invite Link'}
              </button>
            </div>
            <p className="text-white/60 text-sm mt-3">
              Share this code or link with your friends to join!
            </p>
          </div>

          {/* Players Grid */}
          <div className="p-6">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              👥 Players ({players.length}/
              {roomSettings?.maxPlayers || 8})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="relative bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-2 border-2 border-gray-100 hover:border-blue-200 transition-all group"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white shadow-lg"
                    style={{ backgroundColor: AVATAR_COLORS[player.avatar % AVATAR_COLORS.length] }}
                  >
                    {player.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-gray-700 truncate max-w-full">
                    {player.name}
                  </span>
                  <div className="flex gap-1">
                    {player.isHost && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                        👑 Host
                      </span>
                    )}
                    {player.id === myId && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                        You
                      </span>
                    )}
                  </div>
                  
                  {/* Kick button */}
                  {isHost && player.id !== myId && (
                    <button
                      onClick={() => handleKick(player.id)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: (roomSettings?.maxPlayers || 8) - players.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-2 border-2 border-dashed border-gray-200"
                >
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl">
                    ?
                  </div>
                  <span className="text-sm text-gray-400">Waiting...</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings (Host Only) */}
        {isHost && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4 animate-fadeIn">
            <div className="p-6">
              <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                ⚙️ Game Settings
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rounds */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Rounds</label>
                  <select
                    value={roomSettings?.rounds || 3}
                    onChange={(e) => handleSettingChange('rounds', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-semibold focus:outline-none focus:border-blue-400 transition-all"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Draw Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Draw Time (seconds)</label>
                  <select
                    value={roomSettings?.drawTime || 80}
                    onChange={(e) => handleSettingChange('drawTime', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-semibold focus:outline-none focus:border-blue-400 transition-all"
                  >
                    {[15, 30, 45, 60, 80, 100, 120, 150, 180, 240].map(n => (
                      <option key={n} value={n}>{n}s</option>
                    ))}
                  </select>
                </div>

                {/* Max Players */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Max Players</label>
                  <select
                    value={roomSettings?.maxPlayers || 8}
                    onChange={(e) => handleSettingChange('maxPlayers', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-semibold focus:outline-none focus:border-blue-400 transition-all"
                  >
                    {[2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Hints */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Hints</label>
                  <select
                    value={roomSettings?.hints ?? 2}
                    onChange={(e) => handleSettingChange('hints', parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2 text-gray-800 font-semibold focus:outline-none focus:border-blue-400 transition-all"
                  >
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="text-center">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-black text-xl py-4 px-12 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
            >
              {players.length < 2 ? (
                '⏳ Waiting for players...'
              ) : (
                '🚀 Start Game!'
              )}
            </button>
          ) : (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-4 inline-block">
              <p className="text-white font-bold text-lg">
                ⏳ Waiting for host to start the game...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
