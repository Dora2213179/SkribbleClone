import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function ChatPanel() {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, chatMessages, gameState, myId } = useAppStore();

  const isDrawing = gameState.drawerId === myId && gameState.phase === 'drawing';
  const hasGuessed = useAppStore(s => s.players.find(p => p.id === s.myId)?.hasGuessed);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;
    
    socket.emit('guess', { text: message.trim() });
    setMessage('');
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'correct':
        return 'bg-green-100 text-green-800 font-bold border-l-4 border-green-500';
      case 'system':
        return 'bg-blue-50 text-blue-600 italic text-xs';
      case 'close':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b-2 border-gray-200 px-3 py-2">
        <h3 className="font-bold text-gray-700 text-sm">💬 Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ minHeight: 0 }}>
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-400 text-xs mt-4 px-2">
            Type your guesses here! 🎯
          </div>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`px-2 py-1 rounded-lg text-sm animate-fadeIn ${getMessageStyle(msg.type)}`}
          >
            {msg.type === 'system' ? (
              <span>{msg.text}</span>
            ) : msg.type === 'correct' ? (
              <span>🎉 {msg.text}</span>
            ) : (
              <>
                <span className="font-bold text-gray-900">{msg.playerName}: </span>
                <span>{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t-2 border-gray-200 p-2">
        {isDrawing ? (
          <div className="text-center text-gray-400 text-sm py-2 font-semibold">
            ✏️ You are drawing!
          </div>
        ) : hasGuessed ? (
          <div className="text-center text-green-500 text-sm py-2 font-semibold">
            ✅ You guessed it!
          </div>
        ) : (
          <div className="flex gap-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your guess..."
              maxLength={100}
              className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all font-semibold"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ➤
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
