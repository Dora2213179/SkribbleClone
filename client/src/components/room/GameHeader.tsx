import { useAppStore } from '../../store/useAppStore';

export function GameHeader() {
  const { gameState, myId } = useAppStore();
  const isDrawer = gameState.drawerId === myId;
  
  const timerPercent = gameState.totalTime > 0 
    ? (gameState.timeLeft / gameState.totalTime) * 100 
    : 100;
  
  const timerColor = gameState.timeLeft <= 10 
    ? 'text-red-500' 
    : gameState.timeLeft <= 30 
      ? 'text-orange-500' 
      : 'text-green-600';
  
  const timerBarColor = gameState.timeLeft <= 10 
    ? 'bg-red-500' 
    : gameState.timeLeft <= 30 
      ? 'bg-orange-500' 
      : 'bg-green-500';

  if (gameState.phase === 'lobby') return null;

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden animate-fadeIn">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Round Info */}
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 text-xs font-black px-2 py-1 rounded-full">
            Round {gameState.round}/{gameState.totalRounds}
          </span>
        </div>

        {/* Word / Hint Display */}
        <div className="flex-1 text-center px-4">
          {gameState.phase === 'choosing' && (
            <div className="text-gray-500 font-bold animate-pulse">
              {isDrawer ? '✏️ Pick a word!' : `${gameState.drawerName} is choosing a word...`}
            </div>
          )}
          {gameState.phase === 'drawing' && (
            <div>
              {isDrawer ? (
                <span className="text-lg font-black text-green-600 tracking-wider">
                  {gameState.word}
                </span>
              ) : (
                <span className="text-lg font-black text-gray-800 tracking-[0.5em] font-mono">
                  {gameState.hint || '_ _ _ _'}
                </span>
              )}
            </div>
          )}
          {gameState.phase === 'roundEnd' && (
            <div className="font-bold">
              The word was: <span className="text-green-600">{gameState.word}</span>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className={`font-black text-2xl min-w-[60px] text-right ${timerColor} ${
          gameState.timeLeft <= 10 ? 'animate-pulse' : ''
        }`}>
          {gameState.phase === 'drawing' ? `${gameState.timeLeft}s` : ''}
        </div>
      </div>

      {/* Timer Bar */}
      {gameState.phase === 'drawing' && (
        <div className="h-1 bg-gray-200">
          <div 
            className={`h-full ${timerBarColor} transition-all duration-1000 ease-linear`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
