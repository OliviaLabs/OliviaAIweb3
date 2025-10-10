import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import useFloatToTop from '../../hooks/useFloatToTop';

const FloatingBinanceBubble = ({ 
  isOpen, 
  onClose, 
  title = 'Binance', 
  content = '', 
  loading = false, 
  addParticlesToSwarm,
  priceData = null,
  tickerData = null,
  originalQuery = ''
}) => {
  const bubbleId = useState(() => `binance-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
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

  useFloatToTop({ id: bubbleId, isOpen, isDragging, isExpanded, position, setPosition, topBarrier: 20, delayMs: 80, bubbleWidth: 140, gap: 4, margin: 8 });

  // Create pop particles and add them to main swarm
  const createPopEffect = () => {
    if (!addParticlesToSwarm) return;
    
    const bubbleSize = isExpanded ? 160 : 140;
    const bubbleCenter = { x: position.x + bubbleSize / 2, y: position.y + bubbleSize / 2 };
    
    const newParticles = Array.from({ length: 8 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 8;
      return {
        id: `particle-${Date.now()}-${i}`,
        x: bubbleCenter.x + (Math.random() - 0.5) * 20,
        y: bubbleCenter.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * (Math.random() * 8 + 3) + (Math.random() - 0.5) * 0.5,
        vy: Math.sin(angle) * (Math.random() * 8 + 3) - Math.random() * 3,
        size: Math.random() * 2 + 1.5,
      };
    });
    
    addParticlesToSwarm(newParticles);
    setTimeout(onClose, 100);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left mouse button
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleClick = (e) => {
    // Don't toggle if clicking close button
    if (e.target.closest('.close-button')) return;
    
    const now = Date.now();
    if (now - lastClickTime < 300) {
      // Double click - close bubble
      createPopEffect();
    } else {
      // Single click - toggle expanded
      setIsExpanded(prev => !prev);
    }
    setLastClickTime(now);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners when dragging
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

  if (!isOpen) {
    return null;
  }

  // Format price data for display
  const formatPriceData = (data) => {
    if (!data) return null;
    
    if (data.symbol && data.price) {
      return {
        symbol: data.symbol,
        price: parseFloat(data.price).toFixed(8),
        formatted: `$${parseFloat(data.price).toLocaleString()}`
      };
    }
    return null;
  };

  // Format ticker data for display
  const formatTickerData = (data) => {
    if (!data) return null;
    
    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice).toFixed(8),
      change: parseFloat(data.priceChangePercent).toFixed(2),
      volume: parseFloat(data.volume).toLocaleString(),
      high: parseFloat(data.highPrice).toFixed(8),
      low: parseFloat(data.lowPrice).toFixed(8)
    };
  };

  const priceInfo = formatPriceData(priceData);
  const tickerInfo = formatTickerData(tickerData);

  const bubbleContent = (
    <div
      ref={containerRef}
      className={`fixed z-50 transition-all duration-300 ease-out ${
        isExpanded ? 'w-48 h-48' : 'w-36 h-36'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className="relative w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #f0b90b, inset 0 0 20px rgba(240, 185, 11, 0.15)'}}>
        {/* Enhanced neon yellow glowing border effect */}
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: '0 0 25px #f0b90b, 0 0 50px rgba(240, 185, 11, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-yellow-500/5 via-transparent to-yellow-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Close button */}
        <button
          className="close-button absolute top-2 right-2 w-6 h-6 bg-red-500/80 hover:bg-red-600/80 rounded-full flex items-center justify-center text-white text-xs font-bold z-10 transition-colors"
          onClick={createPopEffect}
        >
          ×
        </button>

        {/* Binance logo/icon */}
        <div className="absolute top-3 left-3 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
          <img 
            src="/assets/plugins/binance.png" 
            alt="Binance" 
            className="w-6 h-6 rounded-full"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span className="text-black font-bold text-sm hidden">B</span>
        </div>

        {/* Spherical Content Area - Centered */}
        <div className="absolute inset-8 flex items-center justify-center">
          {loading ? (
            <div className="text-center">
              <div className="text-white/80 text-xs font-medium">Loading...</div>
            </div>
          ) : (
            <div className="text-center space-y-1 max-w-full px-2">
              {/* Price data */}
              {priceInfo && (
                <div>
                  <div className="text-white/90 text-xs font-semibold truncate">{priceInfo.symbol}</div>
                  <div className="text-yellow-400 text-sm font-bold">{priceInfo.formatted}</div>
                </div>
              )}

              {/* Ticker data */}
              {tickerInfo && (
                <div className="space-y-1">
                  <div className="text-white/90 text-xs font-semibold truncate">{tickerInfo.symbol}</div>
                  <div className="text-yellow-400 text-sm font-bold">${parseFloat(tickerInfo.price).toLocaleString()}</div>
                  <div className={`text-xs font-medium ${parseFloat(tickerInfo.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tickerInfo.change >= 0 ? '+' : ''}{tickerInfo.change}%
                  </div>
                </div>
              )}

              {/* Error content */}
              {!priceInfo && !tickerInfo && content && (
                <div className="text-center space-y-1">
                  <div className="text-red-400 text-xs font-semibold">Error</div>
                  <div className="text-white/70 text-xs break-words px-2">
                    {content.includes('Failed to fetch') ? 'Connection failed' : content}
                  </div>
                </div>
              )}

              {/* No data message */}
              {!priceInfo && !tickerInfo && !content && (
                <div className="text-white/60 text-xs">No data</div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto text-center">
            <div className="text-yellow-400/80 text-xs font-medium">Binance Exchange</div>
            {originalQuery && (
              <div className="text-white/50 text-xs mt-1 truncate">"{originalQuery}"</div>
            )}
          </div>
        </div>

        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400/20 animate-pulse"></div>
      </div>
    </div>
  );

  return createPortal(bubbleContent, document.body);
};

FloatingBinanceBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
  priceData: PropTypes.object,
  tickerData: PropTypes.object,
  originalQuery: PropTypes.string
};

export default FloatingBinanceBubble;
