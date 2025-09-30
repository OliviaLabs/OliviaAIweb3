import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
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

  // Create pop particles and add them to main swarm, always close
  const createPopEffect = () => {
    // Use same dynamic sizing logic
    let bubbleSize = 128;
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
  
  // Dynamic bubble size based on content length and expanded state
  let bubbleSize = 70;
  if (isExpanded) bubbleSize = 160;
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  const bubble = (
    <div 
      ref={containerRef}
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-150 ease-in-out'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleWidth}px`,
        height: `${bubbleHeight}px`,
        zIndex: 2147483646, // Slightly lower than Lurky
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="coingecko"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-green-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #4ade80, inset 0 0 20px rgba(74, 222, 128, 0.15)'}}>
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
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-400 shadow-lg shadow-green-500/40 mb-2 bg-black/20">
                <img 
                  src={coingeckoIcon} 
                  alt="CoinGecko" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-green-400">Loading...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden border-2 border-green-400 shadow-lg bg-gradient-to-br from-green-400/30 to-green-600/40">
                      <img src={coingeckoIcon} alt="CoinGecko" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[6px] font-bold text-green-300">{title}</div>
                  </div>
                </div>
              ) : (
                // Expanded
                <div className="w-full h-full flex flex-col p-2">
                  <div className="text-center mb-1">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-green-400 shadow-lg bg-gradient-to-br from-green-400/20 to-green-600/30 mx-auto mb-1">
                      <img src={coingeckoIcon} alt="CoinGecko" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[8px] font-bold text-green-300">{title}</div>
                  </div>
                  
                  <div className="flex-1 px-2 overflow-y-auto">
                    <div className="text-center space-y-1">
                      {typeof content === 'string' ? (
                        <div className="text-[7px] text-white/90 leading-tight space-y-1">
                          {content.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="text-center">
                              {paragraph.split('\n').map((line, lineIndex) => (
                                <span key={lineIndex}>
                                  {line}
                                  {lineIndex < paragraph.split('\n').length - 1 && <br />}
                                </span>
                              ))}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="font-mono text-[6px] text-green-300 bg-black/30 p-1 rounded border border-green-400/30">
                          <pre className="whitespace-pre-wrap text-left">
                            {JSON.stringify(content, null, 2)}
                          </pre>
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
  return createPortal(bubble, document.body);
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
