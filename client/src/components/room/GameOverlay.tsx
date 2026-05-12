import { useAppStore } from '../../store/useAppStore';

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
  '#A3E4D7', '#FAD7A0', '#A9CCE3', '#D5F5E3', '#FADBD8',
];

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

export function GameOverlay() {
  const { socket, gameState, players, isHost } = useAppStore();

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const handlePlayAgain = () => {
    if (!socket) return;
    socket.emit('play_again');
  };

  // Round End Overlay
  if (gameState.phase === 'roundEnd') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-popIn">
          <h2 className="text-2xl font-black text-gray-800 mb-1">⏱️ Time's Up!</h2>
          <p className="text-lg font-bold text-gray-600 mb-4">
            The word was: <span className="text-green-600 text-xl">{gameState.word}</span>
          </p>
          
          {/* Quick scoreboard */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedPlayers.map((player, i) => (
              <div key={player.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-bold text-gray-400 w-6">{i + 1}</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: AVATAR_COLORS[player.avatar % AVATAR_COLORS.length] }}
                >
                  {player.name[0].toUpperCase()}
                </div>
                <span className="flex-1 text-left font-bold text-gray-700 text-sm">{player.name}</span>
                <span className="font-black text-yellow-600">{player.score}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Next round starting soon...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Overlay
  if (gameState.phase === 'gameOver') {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 text-center animate-popIn">
          <h2 className="text-4xl font-black text-gray-800 mb-1">🏆 Game Over!</h2>
          <p className="text-gray-500 font-semibold mb-6">Final Standings</p>
          
          {/* Podium for top 3 */}
          {sortedPlayers.length >= 1 && (
            <div className="flex items-end justify-center gap-4 mb-6">
              {/* 2nd Place */}
              {sortedPlayers[1] && (
                <div className="flex flex-col items-center animate-slideUp" style={{ animationDelay: '0.2s' }}>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shadow-lg border-4 border-gray-300"
                    style={{ backgroundColor: AVATAR_COLORS[sortedPlayers[1].avatar % AVATAR_COLORS.length] }}
                  >
                    {sortedPlayers[1].name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold mt-1 text-gray-600">{sortedPlayers[1].name}</span>
                  <span className="text-lg font-black text-gray-400">{sortedPlayers[1].score}</span>
                  <div className="bg-gray-200 rounded-t-lg w-20 h-16 flex items-center justify-center">
                    <span className="text-2xl">{MEDAL_EMOJIS[1]}</span>
                  </div>
                </div>
              )}
              
              {/* 1st Place */}
              {sortedPlayers[0] && (
                <div className="flex flex-col items-center animate-slideUp" style={{ animationDelay: '0.1s' }}>
                  <div className="text-3xl mb-1 animate-bounce-soft">👑</div>
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-xl border-4 border-yellow-400"
                    style={{ backgroundColor: AVATAR_COLORS[sortedPlayers[0].avatar % AVATAR_COLORS.length] }}
                  >
                    {sortedPlayers[0].name[0].toUpperCase()}
                  </div>
                  <span className="text-base font-black mt-1 text-gray-800">{sortedPlayers[0].name}</span>
                  <span className="text-xl font-black text-yellow-600">{sortedPlayers[0].score}</span>
                  <div className="bg-yellow-200 rounded-t-lg w-24 h-24 flex items-center justify-center">
                    <span className="text-3xl">{MEDAL_EMOJIS[0]}</span>
                  </div>
                </div>
              )}
              
              {/* 3rd Place */}
              {sortedPlayers[2] && (
                <div className="flex flex-col items-center animate-slideUp" style={{ animationDelay: '0.3s' }}>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black text-white shadow-lg border-4 border-orange-300"
                    style={{ backgroundColor: AVATAR_COLORS[sortedPlayers[2].avatar % AVATAR_COLORS.length] }}
                  >
                    {sortedPlayers[2].name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold mt-1 text-gray-600">{sortedPlayers[2].name}</span>
                  <span className="text-lg font-black text-orange-500">{sortedPlayers[2].score}</span>
                  <div className="bg-orange-200 rounded-t-lg w-20 h-12 flex items-center justify-center">
                    <span className="text-2xl">{MEDAL_EMOJIS[2]}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Rest of players */}
          {sortedPlayers.length > 3 && (
            <div className="space-y-2 max-h-32 overflow-y-auto mb-6">
              {sortedPlayers.slice(3).map((player, i) => (
                <div key={player.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-bold text-gray-400 w-6">{i + 4}</span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ backgroundColor: AVATAR_COLORS[player.avatar % AVATAR_COLORS.length] }}
                  >
                    {player.name[0].toUpperCase()}
                  </div>
                  <span className="flex-1 text-left font-bold text-gray-700 text-sm">{player.name}</span>
                  <span className="font-black text-gray-500">{player.score}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Play Again */}
          {isHost ? (
            <button
              onClick={handlePlayAgain}
              className="bg-green-500 hover:bg-green-600 text-white font-black text-lg py-4 px-10 rounded-xl transition-all hover:scale-105 active:scale-100 shadow-lg"
            >
              🔄 Play Again!
            </button>
          ) : (
            <p className="text-gray-400 font-semibold">
              Waiting for host to start a new game...
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
