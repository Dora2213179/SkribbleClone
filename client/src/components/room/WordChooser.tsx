import { useAppStore } from '../../store/useAppStore';

export function WordChooser() {
  const { socket, gameState, myId } = useAppStore();
  
  if (gameState.phase !== 'choosing' || gameState.drawerId !== myId || !gameState.wordOptions) {
    return null;
  }

  const handleChoose = (word: string) => {
    if (!socket) return;
    socket.emit('word_chosen', { word });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 animate-popIn">
        <h2 className="text-2xl font-black text-center text-gray-800 mb-2">
          ✏️ Choose a Word!
        </h2>
        <p className="text-gray-500 text-center text-sm mb-6">
          Pick the word you want to draw
        </p>
        
        <div className="flex flex-col gap-3">
          {gameState.wordOptions.map((word, i) => (
            <button
              key={word}
              onClick={() => handleChoose(word)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-black text-xl py-4 px-6 rounded-xl transition-all hover:scale-105 hover:shadow-lg active:scale-100 capitalize"
              style={{
                animationDelay: `${i * 100}ms`,
                animation: 'slideUp 0.3s ease-out forwards',
              }}
            >
              {word}
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-xs flex items-center justify-center gap-1">
            <span className="animate-pulse">⏱️</span>
            Auto-selecting in 15 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
