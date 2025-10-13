import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';

import React, { useState, useEffect } from 'react';
import kolsIcon from '../../assets/KOLS.png';

const FloatingProtokolsBubble = ({ 
  isOpen, 
  onClose, 
  title = 'Protokols', 
  content = '', 
  loading = false, 
  addParticlesToSwarm 
}) => {
  const bubbleId = useState(() => `protokols-${Date.now()}-${Math.random()}`)[0];
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

  // Remove auto-floating
  useEffect(() => { return undefined; }, [isOpen, isDragging, isExpanded]);

  // Create pop particles and add them to main swarm
  const createPopEffect = () => {
    if (!addParticlesToSwarm) return;
    
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
      // Bubble will resume upward floating automatically
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
  
  // Dynamic bubble size based on content length and expanded state
  let bubbleSize = 140;
  if (isExpanded) bubbleSize = 160;
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
      data-bubble="protokols"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #a855f7, inset 0 0 20px rgba(168, 85, 247, 0.15)'}}>
        {/* Enhanced neon purple glowing border effect */}
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: '0 0 25px #a855f7, 0 0 50px rgba(168, 85, 247, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-500/5 via-transparent to-purple-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>
        
        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-0 shadow-none bg-transparent shadow-purple-500/40 mb-2 bg-transparent">
                <img 
                  src={kolsIcon} 
                  alt="KOLS" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-purple-400">Loading...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Central icon with title below in spherical layout
                <div className="flex flex-col items-center justify-center">
                  {/* Central Protokols Icon */}
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-0 shadow-2xl shadow-purple-500/60 bg-transparent">
                      <img 
                        src={kolsIcon} 
                        alt="KOLS" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Inner circular glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-purple-400/10 to-purple-300/20"></div>
                    </div>
                    {/* Pulsing outer ring */}
                    <div className="absolute inset-0 rounded-full border-0/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  {/* Circular text layout */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-purple-300 drop-shadow-xl">{title}</div>
                  </div>
                </div>
              ) : (
                // Expanded: Spherical content organization
                <div className="w-full h-full relative flex flex-col items-center p-6">
                  {/* Top section - Icon and title in circular arc */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-0 shadow-none bg-transparent shadow-purple-500/40 bg-transparent">
                      <img 
                        src={kolsIcon} 
                        alt="KOLS" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm font-bold text-purple-300 drop-shadow-lg">{title}</div>
                    <div className="text-xs text-white/70 font-medium">KOL Insights</div>
                  </div>
                  
                  {/* Central content area - no scrollbar, proper text layout */}
                  <div className="flex-1 px-6 py-4 mt-24">
                    <div className="text-center space-y-3">
                      {typeof content === 'string' ? (
                        <div className="text-sm text-white/90 leading-relaxed space-y-2">
                          <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                            {content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="font-mono text-xs text-purple-300 bg-black/30 p-3 rounded border-0/30">
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
  return bubble;
};

FloatingProtokolsBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingProtokolsBubble;
