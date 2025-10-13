import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import useFloatToTop from '../../hooks/useFloatToTop';
import coingeckoIcon from '../../assets/coingecko-icon.png';

const FloatingCoinGeckoBubble = ({ isOpen, onClose, title = 'CoinGecko', content = '', loading = false, addParticlesToSwarm }) => {
  const bubbleId = useState(() => `coingecko-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
  const [position, setPosition] = useState(() => {
    // Spread bubbles across the bottom third of screen
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100; // Random between bottom 100-400px
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const containerRef = useRef(null);

  // Remove auto-floating
  useEffect(() => { return undefined; }, [isOpen, isDragging, isExpanded]);

  useFloatToTop({ id: bubbleId, isOpen, isDragging, isExpanded, position, setPosition, topBarrier: 20, delayMs: 80, bubbleWidth: 70, gap: 4, margin: 8 });

  // Create pop particles and add them to main swarm, always close
  const createPopEffect = () => {
  // Use same dynamic sizing logic
  let bubbleSize = 64;
    if (isExpanded && typeof content === 'string') {
      const lines = content.split('\n').length;
      const avgLineLength = content.length / lines;
      const estimatedWidth = Math.max(250, Math.min(450, avgLineLength * 8 + 100));
      const estimatedHeight = Math.max(200, lines * 20 + 80);
      bubbleSize = Math.max(estimatedWidth, estimatedHeight);
    } else if (isExpanded) {
      bubbleSize = 300;
    }
    const bubbleCenter = {
      x: position.x + bubbleSize / 2,
      y: position.y + bubbleSize / 2
    };

    if (addParticlesToSwarm) {
      const newParticles = [];
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = Math.random() * 8 + 3;
        const drift = (Math.random() - 0.5) * 0.5;
        newParticles.push({
          id: Math.random(),
          x: bubbleCenter.x + (Math.random() - 0.5) * 20,
          y: bubbleCenter.y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed + drift,
          vy: Math.sin(angle) * speed - Math.random() * 3,
          size: Math.random() * 2 + 1.5,
        });
      }
      addParticlesToSwarm(newParticles);
    }

    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleMouseDown = (e) => {
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleClick = (e) => {
    // Don't toggle if clicking close button
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    // Check for double-click to pop
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) {
      createPopEffect();
      return;
    }
    setLastClickTime(currentTime);
    
    // Toggle expanded state
    setIsExpanded(prev => !prev);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Use requestAnimationFrame for smoother updates
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

  // Clamp within viewport on expand
  useEffect(() => {
    if (!isOpen || !isExpanded) return;
    const margin = 20;
    requestAnimationFrame(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const maxX = window.innerWidth - rect.width - margin;
      const maxY = window.innerHeight - rect.height - margin;
      const clampedX = Math.max(margin, Math.min(position.x, maxX));
      const clampedY = Math.max(margin, Math.min(position.y, maxY));
      if (clampedX !== position.x || clampedY !== position.y) {
        setPosition({ x: clampedX, y: clampedY });
      }
    });
  }, [isOpen, isExpanded]);

  if (!isOpen) return null;
  
  // Bubble ALWAYS stays circular - never bigger than screen
  const maxSize = Math.min(300, window.innerWidth - 40, window.innerHeight - 100);
  const bubbleSize = isExpanded ? maxSize : 140;
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  const bubble = (
    <div 
      ref={containerRef}
      className={`absolute pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-1000 ease-in-out'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleWidth}px`,
        height: `${bubbleHeight}px`,
        zIndex: 2147483646, // Slightly lower than Lurky
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'top 4800ms linear'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="coingecko"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #4ade80, inset 0 0 20px rgba(74, 222, 128, 0.15)'}}>
        {/* Enhanced neon green glowing border effect */}
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: '0 0 25px #4ade80, 0 0 50px rgba(74, 222, 128, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-green-500/5 via-transparent to-green-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>
        
        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-0 shadow-none bg-transparent shadow-green-500/40 mb-1 bg-transparent">
                <img 
                  src={coingeckoIcon} 
                  alt="CoinGecko" 
                  className="w-full h-full object-cover opacity-50"
                  draggable={false}
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-2">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-0 shadow-none bg-transparent">
                      <img src={coingeckoIcon} alt="CoinGecko" className="w-full h-full object-cover pointer-events-none" draggable={false} />
                    </div>
                  </div>
                  <div className="text-center">
                    
                  </div>
                </div>
              ) : (
                // Expanded - NO ICON, just text
                <div className="w-full h-full flex flex-col justify-center items-center px-4 pt-6 pb-4">
                  <div className="flex-1 overflow-y-auto flex items-center justify-center">
                    <div className="text-center space-y-2">
                      {typeof content === 'string' ? (
                        <div className="text-sm text-white leading-relaxed">
                          {content.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="mb-2">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-white/90">
                          {JSON.stringify(content, null, 2)}
                        </div>
                      )}
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
  return bubble;
};

FloatingCoinGeckoBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingCoinGeckoBubble;
