import PropTypes from 'prop-types';

import React, { useState, useEffect, useRef } from 'react';
import useFloatToTop from '../../hooks/useFloatToTop';
import newsIcon from '../../assets/OLIVIA NEWS.png';

const FloatingNewsBubble = ({ isOpen, onClose, title = 'Trending Tokens', content = '', loading = false, addParticlesToSwarm }) => {
  const bubbleId = useState(() => `news-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
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

  // Remove auto-floating movement
  useEffect(() => { return undefined; }, [isOpen, isDragging, isExpanded]);
  // Gentle float to top with barrier, like other bubbles
  useFloatToTop({ id: bubbleId, isOpen, isDragging, isExpanded, position, setPosition, topBarrier: 20, delayMs: 80, bubbleWidth: 140, gap: 4, margin: 8 });

  // Create pop particles and add them to main swarm
  const createPopEffect = () => {
    if (!addParticlesToSwarm) return;
    
    // Use same sizing logic
    let bubbleSize = 128;
    if (isExpanded) {
      bubbleSize = 400;
    }
    const bubbleCenter = {
      x: position.x + bubbleSize / 2, // Actual bubble center
      y: position.y + bubbleSize / 2  // Actual bubble center
    };

    const newParticles = [];
    for (let i = 0; i < 8; i++) { // Reduced from 25 to 8 particles
      const angle = (Math.PI * 2 * i) / 8;
      const speed = Math.random() * 8 + 3; // Faster initial speed
      const drift = (Math.random() - 0.5) * 0.5; // Random drift
      newParticles.push({
        id: Math.random(),
        x: bubbleCenter.x + (Math.random() - 0.5) * 20, // Slight random spread from center
        y: bubbleCenter.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed + drift,
        vy: Math.sin(angle) * speed - Math.random() * 3, // More varied upward velocity
        size: Math.random() * 2 + 1.5, // Same as background particles: 1.5-3.5px
      });
    }
    
    // Add particles to main swarm
    addParticlesToSwarm(newParticles);
    
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
    
    // Single click toggles expand/collapse
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

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

  // Dynamic bubble size - keep spherical even when expanded
  const maxSize = Math.min(420, window.innerWidth - 40, window.innerHeight - 100);
  const bubbleSize = isExpanded ? maxSize : 140;
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  const bubble = (
    <div 
      className={`absolute pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-1000 ease-in-out'}`}
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
      data-bubble="news"
      data-bubble-id={bubbleId}
    >
      <div className={"w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm"} style={{boxShadow: '0 0 30px #4ade80, inset 0 0 20px rgba(74, 222, 128, 0.15)'}}>
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
                  src={newsIcon} 
                  alt="News" 
                  className="w-full h-full object-cover opacity-50"
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
                      <img src={newsIcon} alt="News" className="w-full h-full object-cover" draggable={false} />
                    </div>
                  </div>
                </div>
              ) : (
                // Expanded
                <div className="w-full h-full flex flex-col px-4 pt-6 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-0 shadow-none bg-black/20">
                      <img src={newsIcon} alt="News" className="w-full h-full object-cover" draggable={false} />
                    </div>
                    <div className="text-sm font-bold text-green-300">{title}</div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="text-left space-y-2">
                      {typeof content === 'string' ? (
                        <div className="text-sm text-white/90 leading-relaxed space-y-2">
                          {content.split('\n').filter(line => line.trim()).map((line, index) => (
                            <div key={index} className={line.startsWith('**') ? 'font-bold text-green-300' : ''}>
                              {line.replace(/\*\*/g, '')}
                            </div>
                          ))}
                        </div>
                      ) : Array.isArray(content) ? (
                        <div className="space-y-2">
                          {content.map((item, index) => (
                            <div key={index} className="text-sm text-white/90 leading-relaxed border-l-4 border-green-400/30 pl-3 py-1.5">
                              {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-white/90 font-mono whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</div>
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

FloatingNewsBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func
};

export default FloatingNewsBubble;