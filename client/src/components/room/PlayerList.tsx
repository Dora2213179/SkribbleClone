import { useAppStore } from '../../store/useAppStore';

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
  '#A3E4D7', '#FAD7A0', '#A9CCE3', '#D5F5E3', '#FADBD8',
];

export function PlayerList() {
  const { players, myId, gameState } = useAppStore();
  
  // Sort by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="bg-gray-50 border-b-2 border-gray-200 px-3 py-2 flex-shrink-0">
        <h3 className="font-bold text-gray-700 text-sm">👥 Players ({players.length})</h3>
      </div>
      
      <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === myId;
          const isDrawing = player.id === gameState.drawerId;
          const hasGuessed = player.hasGuessed;
          
          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 transition-all ${
                isDrawing ? 'bg-blue-50' : hasGuessed ? 'bg-green-50' : ''
              } ${isMe ? 'font-bold' : ''}`}
            >
              {/* Rank */}
              <span className="text-xs font-bold text-gray-400 w-4 text-center">
                {gameState.phase !== 'lobby' ? `#${index + 1}` : ''}
              </span>
              
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                  isDrawing ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                }`}
                style={{ backgroundColor: AVATAR_COLORS[player.avatar % AVATAR_COLORS.length] }}
              >
                {player.name[0].toUpperCase()}
              </div>
              
              {/* Name & Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-sm truncate ${isMe ? 'text-blue-600' : 'text-gray-800'}`}>
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded font-bold">
                      YOU
                    </span>
                  )}
                  {player.isHost && (
                    <span className="text-[10px]">👑</span>
                  )}
                </div>
                {isDrawing && (
                  <span className="text-[10px] text-blue-500 font-semibold">✏️ Drawing</span>
                )}
                {hasGuessed && !isDrawing && (
                  <span className="text-[10px] text-green-500 font-semibold">✅ Guessed</span>
                )}
              </div>
              
              {/* Score */}
              <span className={`text-sm font-black ${
                player.score > 0 ? 'text-yellow-600' : 'text-gray-400'
              }`}>
                {player.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
