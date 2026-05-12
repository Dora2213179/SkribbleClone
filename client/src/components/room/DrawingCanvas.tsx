import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { StrokeData } from '../../types';

const COLORS = [
  '#000000', '#FFFFFF', '#C1C1C1', '#EF130B', '#FF7100', '#FFE400',
  '#00CC00', '#00FF26', '#267FFF', '#0018FF', '#A800FF', '#FF00D4',
  '#4A2800', '#A0522D', '#FF6984', '#FFB8DE', '#CF6EE4', '#00D2FF',
  '#808080', '#505050', '#803300', '#FF69B4',
];

const SIZES = [2, 4, 8, 14, 24];

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  
  const { socket, gameState, myId, strokes, addStroke } = useAppStore();
  const isMyTurn = gameState.drawerId === myId && gameState.phase === 'drawing';

  // Resize canvas to match container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    
    // Redraw existing strokes
    redrawStrokes();
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Redraw all strokes (used for undo/sync)
  const redrawStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    let isInStroke = false;
    
    for (const stroke of strokes) {
      if (stroke.type === 'start') {
        isInStroke = true;
        ctx.beginPath();
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : (stroke.color || '#000000');
        ctx.lineWidth = stroke.size || 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (stroke.x !== undefined && stroke.y !== undefined) {
          ctx.moveTo(stroke.x * rect.width, stroke.y * rect.height);
        }
      } else if (stroke.type === 'move' && isInStroke) {
        if (stroke.x !== undefined && stroke.y !== undefined) {
          ctx.lineTo(stroke.x * rect.width, stroke.y * rect.height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(stroke.x * rect.width, stroke.y * rect.height);
        }
      } else if (stroke.type === 'end') {
        isInStroke = false;
        ctx.closePath();
      } else if (stroke.type === 'fill') {
        ctx.fillStyle = stroke.color || '#FFFFFF';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }
  }, [strokes]);

  // Redraw when strokes change
  useEffect(() => {
    redrawStrokes();
  }, [strokes, redrawStrokes]);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMyTurn || !socket) return;
    e.preventDefault();
    
    const pos = getCanvasPos(e);
    if (!pos) return;
    
    isDrawingRef.current = true;
    lastPosRef.current = pos;
    
    const strokeData: StrokeData = {
      type: 'start',
      x: pos.x,
      y: pos.y,
      color: tool === 'eraser' ? '#FFFFFF' : selectedColor,
      size: brushSize,
      tool,
    };
    
    socket.emit('draw_start', strokeData);
    addStroke(strokeData);
    
    // Draw locally
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : selectedColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(pos.x * rect.width, pos.y * rect.height);
      }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMyTurn || !isDrawingRef.current || !socket) return;
    e.preventDefault();
    
    const pos = getCanvasPos(e);
    if (!pos) return;
    
    const moveData: StrokeData = { type: 'move', x: pos.x, y: pos.y };
    socket.emit('draw_move', { x: pos.x, y: pos.y });
    addStroke(moveData);
    
    // Draw locally
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(pos.x * rect.width, pos.y * rect.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x * rect.width, pos.y * rect.height);
      }
    }
    
    lastPosRef.current = pos;
  };

  const handleEnd = () => {
    if (!isMyTurn || !isDrawingRef.current || !socket) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;
    const endData: StrokeData = { type: 'end' };
    socket.emit('draw_end');
    addStroke(endData);
  };

  const handleClear = () => {
    if (!isMyTurn || !socket) return;
    socket.emit('canvas_clear');
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }
  };

  const handleUndo = () => {
    if (!isMyTurn || !socket) return;
    socket.emit('draw_undo');
  };

  const handleFill = () => {
    if (!isMyTurn || !socket) return;
    
    const fillData: StrokeData = { type: 'fill', color: selectedColor };
    socket.emit('draw_fill', fillData);
    addStroke(fillData);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const rect = canvas.getBoundingClientRect();
        ctx.fillStyle = selectedColor;
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 bg-white rounded-t-xl overflow-hidden relative border-2 border-gray-200"
        style={{ minHeight: '300px' }}
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full ${isMyTurn ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        
        {!isMyTurn && gameState.phase === 'drawing' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold">
            {gameState.drawerName} is drawing...
          </div>
        )}
      </div>

      {/* Drawing Tools - Only shown when it's your turn */}
      {isMyTurn && (
        <div className="bg-gray-100 rounded-b-xl border-2 border-t-0 border-gray-200 p-2 animate-fadeIn">
          {/* Color Palette */}
          <div className="flex flex-wrap gap-1 justify-center mb-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { setSelectedColor(color); setTool('brush'); }}
                className={`w-7 h-7 rounded transition-all ${
                  selectedColor === color && tool === 'brush'
                    ? 'ring-2 ring-offset-1 ring-blue-500 scale-110'
                    : 'hover:scale-110'
                }`}
                style={{ 
                  backgroundColor: color,
                  border: color === '#FFFFFF' ? '1px solid #ccc' : '1px solid rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </div>

          {/* Brush Size & Tools */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Sizes */}
            <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`flex items-center justify-center w-8 h-8 rounded transition-all ${
                    brushSize === size ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                >
                  <div
                    className="rounded-full bg-gray-800"
                    style={{ width: Math.min(size, 20), height: Math.min(size, 20) }}
                  />
                </button>
              ))}
            </div>

            {/* Tool Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTool('brush')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  tool === 'brush' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                ✏️ Brush
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  tool === 'eraser' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                🧹 Eraser
              </button>
              <button
                onClick={handleFill}
                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-white text-gray-600 hover:bg-yellow-100 transition-all"
              >
                🪣 Fill
              </button>
              <button
                onClick={handleUndo}
                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-white text-gray-600 hover:bg-orange-100 transition-all"
              >
                ↩️ Undo
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-white text-red-500 hover:bg-red-100 transition-all"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
