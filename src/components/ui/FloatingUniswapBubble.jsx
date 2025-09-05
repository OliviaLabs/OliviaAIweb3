import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';

const FloatingUniswapBubble = ({ isOpen, onClose, title = 'Uniswap V3', content = '', loading = false, addParticlesToSwarm }) => {
  const bubbleId = useState(() => `uniswap-${Date.now()}-${Math.random()}`)[0];
  const [position, setPosition] = useState(() => {
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100;
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [poolData, setPoolData] = useState(null);
  const [ethPrice, setEthPrice] = useState(null);

  useEffect(() => {
    if (!isOpen || isDragging) return;

    const interval = setInterval(() => {
      setPosition(prev => {
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
        const margin = 20;
        
        let newY = prev.y;
        let newX = prev.x;
        
        const floatForce = -1.0;
        newY += floatForce;
        
        if (newY < margin) {
          newY = margin;
        }
        
        if (newX < margin) {
          newX = margin;
        } else if (newX > window.innerWidth - bubbleSize - margin) {
          newX = window.innerWidth - bubbleSize - margin;
        }
        
        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isDragging, isExpanded, content]);

  useEffect(() => {
    if (isOpen && !poolData) {
      loadUniswapData();
    }
  }, [isOpen]);

  const loadUniswapData = async () => {
    try {
      const [pools, price] = await Promise.all([
        uniswapService.getTopPools(5),
        uniswapService.getETHPrice()
      ]);
      
      setPoolData(pools);
      setEthPrice(price);
    } catch (error) {
      console.error('Uniswap data load error:', error);
    }
  };

  const createPopEffect = () => {
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
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 300) {
      createPopEffect();
      return;
    }
    setLastClickTime(currentTime);
    
    setIsExpanded(prev => !prev);
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

  const formatVolume = (volume) => {
    if (!volume) return 'N/A';
    const vol = parseFloat(volume);
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    const p = parseFloat(price);
    if (p >= 1000) return `$${p.toFixed(0)}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(6)}`;
  };

  let bubbleSize = 140;
  if (isExpanded && typeof content === 'string') {
    const lines = content.split('\n').length;
    const avgLineLength = content.length / lines;
    const estimatedWidth = Math.max(320, Math.min(480, avgLineLength * 8 + 140));
    const estimatedHeight = Math.max(280, lines * 22 + 120);
    bubbleSize = Math.max(estimatedWidth, estimatedHeight);
  } else if (isExpanded) {
    bubbleSize = 380;
  }
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
        zIndex: 2147483646,
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="uniswap"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-green-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #4ade80, inset 0 0 20px rgba(74, 222, 128, 0.15)'}}>
        <div className="absolute inset-0 rounded-full border border-green-300/60 animate-pulse" style={{boxShadow: '0 0 25px #4ade80, 0 0 50px rgba(74, 222, 128, 0.3)'}}></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-green-500/5 via-transparent to-green-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-300 text-xs font-bold flex items-center justify-center border border-green-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30"
          aria-label="Close"
        >
          ×
        </button>
        
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-green-400 shadow-lg shadow-green-500/40 mb-2 bg-black/20 flex items-center justify-center text-2xl">
                🦄
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
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-4 border-green-400 shadow-2xl shadow-green-500/60 bg-gradient-to-br from-green-400/30 to-green-600/40 hover:border-green-300 transition-all duration-300 hover:shadow-green-400/80 hover:scale-105 group flex items-center justify-center text-2xl">
                      🦄
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-green-300/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs font-bold text-green-300 drop-shadow-xl">{title}</div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative flex flex-col items-center p-6">
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-400 shadow-lg shadow-green-500/40 bg-gradient-to-br from-green-400/20 to-green-600/30 mb-2 flex items-center justify-center text-3xl">
                      🦄
                    </div>
                    <div className="text-sm font-bold text-green-300 drop-shadow-lg">{title}</div>
                    <div className="text-xs text-white/70 font-medium">DEX Trading</div>
                  </div>
                  
                  <div className="flex-1 px-6 py-4 mt-24">
                    <div className="text-center space-y-3">
                      {ethPrice && (
                        <div className="text-sm text-green-300 font-bold">
                          ETH: {formatPrice(ethPrice)}
                        </div>
                      )}
                      
                      {poolData && poolData.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-green-400 font-semibold">Top Pools</div>
                          {poolData.slice(0, 3).map((pool, index) => (
                            <div key={pool.id} className="text-xs text-white/80 bg-green-900/20 p-2 rounded">
                              <div className="text-green-300 font-medium">
                                {pool.token0?.symbol}/{pool.token1?.symbol}
                              </div>
                              <div className="text-green-400">
                                Vol: {formatVolume(pool.volumeUSD)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => window.open('https://app.uniswap.org/#/swap', '_blank')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded transition-colors"
                        >
                          Trade
                        </button>
                        <button
                          onClick={() => window.open('https://app.uniswap.org/#/pools', '_blank')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
                        >
                          Pools
                        </button>
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

export default FloatingUniswapBubble;
