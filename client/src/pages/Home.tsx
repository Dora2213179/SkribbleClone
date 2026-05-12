import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
  '#A3E4D7', '#FAD7A0', '#A9CCE3', '#D5F5E3', '#FADBD8',
];

export function Home() {
  const [searchParams] = useSearchParams();
  const urlRoomCode = searchParams.get('room');
  
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(urlRoomCode || '');
  const [activeTab, setActiveTab] = useState<'play' | 'private'>(urlRoomCode ? 'private' : 'play');
  const [selectedAvatar, setSelectedAvatar] = useState(Math.floor(Math.random() * 20));
  
  const { socket, connect, setUserInfo, isConnected } = useAppStore();
  const navigate = useNavigate();


  
  useEffect(() => {
    connect(import.meta.env.VITE_SERVER_URL || 'http://localhost:3001');
  }, [connect]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !socket || !isConnected) return;
    
    setUserInfo(name.trim(), selectedAvatar);
    socket.emit('create_room', { 
      hostName: name.trim(), 
      avatar: selectedAvatar,
      settings: { isPrivate: true }
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomCode.trim() || !socket || !isConnected) return;
    
    setUserInfo(name.trim(), selectedAvatar);
    socket.emit('join_room', { 
      roomId: roomCode.trim().toUpperCase(), 
      playerName: name.trim(), 
      avatar: selectedAvatar 
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      
      {/* Logo */}
      <div className="mb-6 animate-popIn">
        <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight"
          style={{
            textShadow: '3px 3px 0 rgba(0,0,0,0.2), -1px -1px 0 rgba(255,255,255,0.1)',
            letterSpacing: '-2px',
          }}>
          skribbl
          <span className="text-yellow-300">.io</span>
        </h1>
        <p className="text-white/80 text-center text-lg font-semibold mt-1">
          Draw, Guess & Win! ✏️
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md animate-slideUp">
        <div className="bg-white rounded-2xl shadow-skribbl-lg overflow-hidden">
          
          {/* Connection Status */}
          {!isConnected && (
            <div className="bg-orange-50 border-b-2 border-orange-200 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-orange-600 font-semibold text-sm">Connecting to server...</span>
              </div>
            </div>
          )}

          {/* Avatar Selection */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white border-4 border-white shadow-lg cursor-pointer transition-transform hover:scale-110"
                style={{ backgroundColor: AVATAR_COLORS[selectedAvatar] }}
                onClick={() => setSelectedAvatar((selectedAvatar + 1) % AVATAR_COLORS.length)}
                title="Click to change color"
              >
                {name ? name[0].toUpperCase() : '?'}
              </div>
              <div className="flex-1">
                <input
                  id="player-name"
                  type="text"
                  required
                  maxLength={20}
                  placeholder="Enter your name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-lg font-semibold"
                />
              </div>
            </div>

            {/* Avatar Color Strip */}
            <div className="flex gap-1 justify-center flex-wrap">
              {AVATAR_COLORS.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(i)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    selectedAvatar === i 
                      ? 'ring-2 ring-offset-2 ring-blue-400 scale-125' 
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t-2 border-gray-100">
            <button
              className={`flex-1 py-3 font-bold text-sm transition-all ${
                activeTab === 'play' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('play')}
            >
              🎮 Create Room
            </button>
            <button
              className={`flex-1 py-3 font-bold text-sm transition-all ${
                activeTab === 'private' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('private')}
            >
              🔗 Join Room
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'play' ? (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <p className="text-gray-500 text-sm text-center">
                  Create a private room and invite your friends!
                </p>
                <button
                  type="submit"
                  disabled={!isConnected || !name.trim()}
                  className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-black py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  Create Private Room! 🎨
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <input
                    id="room-code"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter room code..."
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all text-lg font-semibold text-center tracking-[0.3em] uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isConnected || !name.trim() || !roomCode.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-black py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  Join Room! 🚀
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/50 text-center text-xs mt-4">
          Made with ❤️ • skribbl clone
        </p>
      </div>
    </div>
  );
}
