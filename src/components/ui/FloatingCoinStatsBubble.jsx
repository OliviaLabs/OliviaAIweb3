import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import useFloatToTop from '../../hooks/useFloatToTop';
import coinstatsLogo from '../../assets/coinstats-2.png';

const FloatingCoinStatsBubble = ({ isOpen, onClose, title = 'CoinStats', content = '', loading = false, addParticlesToSwarm }) => {
  const bubbleId = useState(() => `coinstats-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
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
  useEffect(() => { if (!isOpen || isDragging) return; return undefined;
  }, [isOpen, isDragging, isExpanded, bubbleId]);

  useFloatToTop({ id: bubbleId, isOpen, isDragging, isExpanded, position, setPosition, topBarrier: 20, delayMs: 80, bubbleWidth: 140, gap: 4, margin: 8 });

  // Create pop particles and add them to main swarm
  const createPopEffect = () => {
    if (!addParticlesToSwarm) return;
    
    // Use same dynamic sizing logic\n    let bubbleSize = 128;\n    if (isExpanded && typeof content === 'string') {\n      const lines = content.split('\\n').length;\n      const avgLineLength = content.length / lines;\n      const estimatedWidth = Math.max(250, Math.min(400, avgLineLength * 8 + 100));\n      const estimatedHeight = Math.max(200, lines * 20 + 80);\n      bubbleSize = Math.max(estimatedWidth, estimatedHeight);\n    } else if (isExpanded) {\n      bubbleSize = 280;\n    }
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
    
    // Close bubble after pop animation starts
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
  
  // Responsive bubble sizes: half-size on mobile, full-size on desktop
  const isMobile = window.innerWidth < 768;
  const collapsedSize = isMobile ? 70 : 140;
  const maxExpandedSize = isMobile ? 150 : 300;
  
  // Bubble ALWAYS stays circular - never bigger than screen
  const maxSize = Math.min(maxExpandedSize, window.innerWidth - 40, window.innerHeight - 100);
  const bubbleSize = isExpanded ? maxSize : collapsedSize;
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  const bubble = (
    <div 
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-150 ease-in-out'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleWidth}px`,
        height: `${bubbleHeight}px`,
        zIndex: 2147483643, // Lower than others
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'top 4800ms linear'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="coinstats"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #3b82f6, inset 0 0 20px rgba(59, 130, 246, 0.15)'}}>
        {/* Enhanced neon blue glowing border effect */}
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: '0 0 25px #3b82f6, 0 0 50px rgba(59, 130, 246, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-500/5 via-transparent to-blue-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>
        
        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-0 shadow-none bg-transparent shadow-blue-500/40 mb-2 bg-transparent">
                <img 
                  src={coinstatsLogo} 
                  alt="CoinStats Logo" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-blue-400">Loading...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Unified 80px circular icon
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-0 shadow-none bg-transparent">
                    <img 
                      src={coinstatsLogo} 
                      alt="CoinStats Logo" 
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                </div>
              ) : (
                // Expanded: Top-aligned content with safe padding below header
                <div className="w-full h-full relative flex flex-col items-center px-4 pt-6 pb-4">
                  {/* Top section - Icon and title in circular arc */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-0 shadow-none bg-transparent shadow-blue-500/40 bg-transparent">
                      <img 
                        src={coinstatsLogo} 
                        alt="CoinStats Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm font-bold text-blue-300 drop-shadow-lg">{title}</div>
                    <div className="text-xs text-white/70 font-medium">Market Data</div>
                  </div>
                  
                  {/* Central content area - no scrolling, with safe top padding under header */}
                  <div className="flex-1 px-6 pb-4 pt-24 overflow-hidden">
                    <div className="text-center space-y-3">
                      {typeof content === 'string' ? (
                        <div className="text-sm text-white/90 leading-relaxed space-y-2">
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
                        <div className="text-white/90">
                          {(() => {
                            const coin = content || {};
                            const iconUrl = coin.icon || coin.image || coin.logo;
                            const name = coin.name || coin.title || coin.coin || 'Unknown';
                            const symbol = (coin.symbol || coin.ticker || '').toUpperCase();
                            const price = coin.price ?? coin.priceUSD ?? coin.price_usd ?? coin.market_data?.current_price?.usd;
                            const change24h = coin.change24h ?? coin.priceChange1d ?? coin.market_data?.price_change_percentage_24h;
                            const marketCap = coin.marketCap ?? coin.market_cap ?? coin.market_data?.market_cap?.usd;
                            const volume24h = coin.volume24h ?? coin.volume ?? coin.market_data?.total_volume?.usd;

                            const fmtUsd = (v) => {
                              if (v == null || isNaN(v)) return 'N/A';
                              const n = Number(v);
                              if (n < 1) return `$${n.toFixed(6)}`;
                              if (n < 1000) return `$${n.toFixed(2)}`;
                              if (n < 1e6) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                              if (n < 1e9) return `$${(n/1e6).toFixed(2)}M`;
                              return `$${(n/1e9).toFixed(2)}B`;
                            };
                            const fmtPct = (v) => {
                              if (v == null || isNaN(v)) return 'N/A';
                              const n = Number(v);
                              const sign = n > 0 ? '+' : '';
                              return `${sign}${n.toFixed(2)}%`;
                            };

                            return (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                  {iconUrl ? (
                                    <img src={iconUrl} alt={name} className="w-6 h-6 rounded-full object-cover" />
                                  ) : null}
                                  <div className="text-sm font-semibold text-blue-300 truncate">
                                    {name}{symbol ? ` (${symbol})` : ''}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-white/5 rounded p-2 text-left">
                                    <div className="text-white/60">Price</div>
                                    <div className="font-semibold">{fmtUsd(price)}</div>
                                  </div>
                                  <div className="bg-white/5 rounded p-2 text-left">
                                    <div className="text-white/60">24h</div>
                                    <div className={`font-semibold ${Number(change24h) > 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtPct(change24h)}</div>
                                  </div>
                                  <div className="bg-white/5 rounded p-2 text-left">
                                    <div className="text-white/60">Market Cap</div>
                                    <div className="font-semibold">{fmtUsd(marketCap)}</div>
                                  </div>
                                  <div className="bg-white/5 rounded p-2 text-left">
                                    <div className="text-white/60">Volume 24h</div>
                                    <div className="font-semibold">{fmtUsd(volume24h)}</div>
                                  </div>
                                </div>
                                <div className="text-[10px] text-white/50 text-center">Powered by CoinStats</div>
                              </div>
                            );
                          })()}
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

FloatingCoinStatsBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingCoinStatsBubble;
