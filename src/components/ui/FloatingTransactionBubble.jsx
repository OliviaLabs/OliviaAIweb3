import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import useBubbleInteractions from '../../hooks/useBubbleInteractions';
import useBubbleFloating from '../../hooks/useBubbleFloating';

const FloatingTransactionBubble = ({ isOpen, onClose, title = 'Transaction Success', content = '', loading = false }) => {
  const bubbleId = useState(() => `transaction-${Date.now()}-${Math.random()}`)[0];
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const { isExpanded, isPopping, handleClick } = useBubbleInteractions(onClose);
  const position = useBubbleFloating(isOpen, isDragging, isExpanded, bubbleId);


  const handleMouseDown = (e) => {
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    requestAnimationFrame(() => {
      setPosition({ x: newX, y: newY });
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };


  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  let bubbleSize = 140;
  if (isExpanded) {
    bubbleSize = 380;
  }

  const bubble = (
    <div 
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-150 ease-in-out'} ${isPopping ? 'animate-ping scale-150 opacity-0' : ''}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleSize}px`,
        height: `${bubbleSize}px`,
        zIndex: 2147483644,
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="transaction"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-green-800/80 via-green-900/90 to-green-950/95 border-2 border-green-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #4ade80, inset 0 0 20px rgba(74, 222, 128, 0.15)'}}>
        {/* Enhanced neon green glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-green-300/60 animate-pulse" style={{boxShadow: '0 0 25px #4ade80, 0 0 50px rgba(74, 222, 128, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-green-500/5 via-transparent to-green-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Enhanced close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-300 text-xs font-bold flex items-center justify-center border border-green-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-400 shadow-lg shadow-green-500/40 mb-2 bg-black/20 flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="text-xs font-semibold text-green-400">Processing...</div>
            </div>
          ) : (
            <div className="text-white w-full h-full flex items-center justify-center text-center">
              {!isExpanded ? (
                // Collapsed: Central icon with title below
                <div className="flex flex-col items-center justify-center">
                  {/* Central Success Icon */}
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl shadow-green-500/60 bg-gradient-to-br from-green-400/30 to-green-600/40 hover:border-green-300 transition-all duration-300 hover:shadow-green-400/80 hover:scale-105 group flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    {/* Pulsing outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-green-300/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  {/* Circular text layout */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-green-300 drop-shadow-xl">{title}</div>
                  </div>
                </div>
              ) : (
                // Expanded: Spherical layout with enhanced content
                <div className="w-full h-full flex flex-col">
                  {/* Header section with icon and title */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl shadow-green-500/60 bg-gradient-to-br from-green-400/30 to-green-600/40 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-3xl">✅</span>
                    </div>
                    <div className="text-sm font-bold text-green-300 drop-shadow-lg">{title}</div>
                    <div className="text-xs text-white/70 font-medium">Transaction Complete</div>
                  </div>
                  
                  {/* Central content area */}
                  <div className="flex-1 px-6 py-4">
                    <div className="text-center space-y-3">
                      <div className="text-sm text-white/90 leading-relaxed space-y-2">
                        {content.split('\n').map((line, index) => (
                          <p key={index} className="text-center text-xs">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return createPortal(bubble, document.body);
};

FloatingTransactionBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
};

export default FloatingTransactionBubble;
