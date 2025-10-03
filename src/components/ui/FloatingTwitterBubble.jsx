import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import useFloatToTop from '../../hooks/useFloatToTop';
import twitterIcon from '../../assets/x-icon.png';

const FloatingTwitterBubble = ({ isOpen, onClose, title = 'Twitter/X', content = '', loading = false, addParticlesToSwarm }) => {
  const bubbleId = useState(() => `twitter-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
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
    
    // Use same dynamic sizing logic
    let bubbleSize = 128;
    if (isExpanded && typeof content === 'string') {
      const lines = content.split('\n').length;
      const avgLineLength = content.length / lines;
      const estimatedWidth = Math.max(280, Math.min(320, avgLineLength * 6 + 80));
      const estimatedHeight = Math.max(280, Math.min(320, lines * 18 + 80));
      bubbleSize = Math.max(estimatedWidth, estimatedHeight);
    } else if (isExpanded) {
      bubbleSize = 320;
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
  
  const collapsedSize = 140;
  const maxExpandedSize = 420; // Twitter needs more space
  
  // Larger expanded bubble for readability, still clamped to viewport
  const maxSize = Math.min(maxExpandedSize, window.innerWidth - 40, window.innerHeight - 100);
  const bubbleSize = isExpanded ? maxSize : collapsedSize;
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
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'top 4800ms linear'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="twitter"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-white/40 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)'}}>
        {/* Enhanced glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-white/30 animate-pulse" style={{boxShadow: '0 0 25px rgba(255, 255, 255, 0.4), 0 0 50px rgba(255, 255, 255, 0.2)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/5 via-transparent to-white/10 animate-pulse" style={{animationDuration: '3s'}}></div>
        
        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 shadow-lg shadow-white/20 mb-2 bg-transparent">
                <img 
                  src={twitterIcon} 
                  alt="Twitter/X" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-white/80">Searching...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Unified 80px circular icon
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-0 shadow-none bg-transparent">
                    <img 
                      src={twitterIcon} 
                      alt="Twitter/X" 
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                </div>
              ) : (
                // Expanded: Spherical content organization
                <div className="w-full h-full relative flex flex-col items-center px-4 pt-6 pb-4">
                  {/* Top section - Icon and title in circular arc */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 shadow-lg shadow-white/30 bg-transparent">
                      <img 
                        src={twitterIcon} 
                        alt="Twitter/X" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm font-bold text-white/90 drop-shadow-lg">{title}</div>
                    <div className="text-xs text-white/70 font-medium">Social Media</div>
                  </div>
                  
                  {/* Central content area - scrollable tweets or fallback */}
                  <div className="flex-1 px-3 pt-24 pb-3 overflow-y-auto w-full">
                    {Array.isArray(content) && content.length > 0 ? (
                      <div className="space-y-2.5">
                        {content.slice(0, 10).map((tweet) => (
                          <a
                            key={tweet.id}
                            href={tweet.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-md border border-white/15 bg-white/5 p-2.5 text-left hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <img
                                src={tweet.user?.profile_image_url || ''}
                                alt={tweet.user?.username || ''}
                                className="w-5 h-5 rounded-full object-cover bg-white/20 flex-shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <div className="min-w-0">
                                <div className="text-[11px] text-white/80 truncate">
                                  {tweet.user?.name || tweet.user?.username || 'User'}
                                  {tweet.user?.username ? (
                                    <span className="text-white/50"> @{tweet.user.username}</span>
                                  ) : null}
                                </div>
                                <div className="text-[12px] text-white/90 break-words leading-tight mt-0.5">
                                  {(tweet.text || '').length > 200 ? `${tweet.text.slice(0, 200)}…` : (tweet.text || '')}
                                </div>
                                <div className="text-[10px] text-white/50 mt-1">
                                  ❤ {tweet.favorite_count || 0}  ↻ {tweet.retweet_count || 0}  💬 {tweet.reply_count || 0}
                                </div>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        {typeof content === 'string' ? (
                          <div className="text-[12px] text-white/90 leading-tight">
                            {content}
                          </div>
                        ) : (
                          <div className="text-xs text-white/60">No tweets found.</div>
                        )}
                      </div>
                    )}
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

FloatingTwitterBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingTwitterBubble;