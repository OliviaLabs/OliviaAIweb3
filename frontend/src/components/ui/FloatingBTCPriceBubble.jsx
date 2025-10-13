import PropTypes from 'prop-types';

import React, { useState, useEffect } from 'react';
import useFloatToTop from '../../hooks/useFloatToTop';
import { Bitcoin } from 'lucide-react';

const FloatingBTCPriceBubble = ({ isOpen, onClose, title = 'BTC Price', priceBtc = 0, tokenName = '', addParticlesToSwarm }) => {
  const bubbleId = useState(() => `btcprice-${Date.now()}-${Math.random()}`)[0];
  const [position, setPosition] = useState(() => ({
    x: Math.random() * (window.innerWidth - 300) + 100,
    y: window.innerHeight - Math.random() * 300 - 100
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => { return undefined; }, [isOpen, isDragging, isExpanded]);
  useFloatToTop({ isOpen, isDragging, isExpanded, position, setPosition, topBarrier: 20, speed: 0.6 });

  const createPopEffect = () => {
    const bubbleSize = isExpanded ? 160 : 70;
    const bubbleCenter = { x: position.x + bubbleSize / 2, y: position.y + bubbleSize / 2 };
    if (addParticlesToSwarm) {
      const newParticles = Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 8;
        return {
          id: Math.random(),
          x: bubbleCenter.x + (Math.random() - 0.5) * 20,
          y: bubbleCenter.y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * (Math.random() * 8 + 3) + (Math.random() - 0.5) * 0.5,
          vy: Math.sin(angle) * (Math.random() * 8 + 3) - Math.random() * 3,
          size: Math.random() * 2 + 1.5,
        };
      });
      addParticlesToSwarm(newParticles);
    }
    setTimeout(onClose, 100);
  };

  const handleMouseDown = (e) => {
    if (e.target.getAttribute('aria-label') === 'Close') return;
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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
    requestAnimationFrame(() => {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    });
  };

  const handleMouseUp = () => setIsDragging(false);

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
  
  // Bubble ALWAYS stays circular - never bigger than screen (match ICP/CoinGecko)
  const maxSize = Math.min(300, window.innerWidth - 40, window.innerHeight - 100);
  const bubbleSize = isExpanded ? maxSize : 70;
  const scoreColor = '#f7931a'; // bitcoin orange
  
  const bubble = (
    <div 
      className={`absolute pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-1000 ease-in-out'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleSize}px`,
        height: `${bubbleSize}px`,
        zIndex: 2147483636,
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'top 2400ms linear'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="btc-price"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: `0 0 30px ${scoreColor}, inset 0 0 20px ${scoreColor}33`}}>
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: `0 0 25px ${scoreColor}, 0 0 50px ${scoreColor}4d`}}></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/5 animate-pulse" style={{animationDuration: '3s'}}></div>
        
        <div className="absolute inset-4 flex items-center justify-center">
          {!isExpanded ? (
            // Collapsed: Unified 80px circular icon
            <div className="flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full overflow-hidden border-0 shadow-none bg-transparent flex items-center justify-center" style={{backgroundColor: `${scoreColor}20`}}>
                <Bitcoin size={40} style={{color: scoreColor}} />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-center items-center px-4 pt-6 pb-4">
              <div className="text-center mb-1">
                <div className="w-10 h-10 rounded-full border-0 shadow-none bg-transparent mx-auto mb-1 flex items-center justify-center" style={{backgroundColor: `${scoreColor}20`}}>
                  <Bitcoin size={24} style={{color: scoreColor}} />
                </div>
                <div className="text-[8px] font-bold" style={{color: scoreColor}}>{tokenName}</div>
              </div>
              <div className="flex-1 px-2 overflow-y-auto flex items-center justify-center">
                <div className="text-center space-y-1">
                  <div className="text-[12px] font-bold" style={{color: scoreColor}}>
                    {priceBtc.toFixed(8)} BTC
                  </div>
                  <p className="text-[7px] text-white/90">Price in Bitcoin</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  return bubble;
};

FloatingBTCPriceBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  priceBtc: PropTypes.number,
  tokenName: PropTypes.string,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingBTCPriceBubble;
