import PropTypes from 'prop-types';

import React, { useState, useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import useFloatToTop from '../../hooks/useFloatToTop';

const FloatingVolatilityScoreBubble = ({ isOpen, onClose, title = 'Volatility Score', score = 0, tokenName = '', addParticlesToSwarm }) => {
  const bubbleId = useState(() => `volatility-${Date.now()}-${Math.random()}`)[0];
  const delayMs = useState(() => 80 + Math.random() * 100)[0]; // Stable random delay
  const [position, setPosition] = useState(() => {
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

  useFloatToTop({ id: bubbleId, isOpen, isDragging, isExpanded, position, setPosition, topBarrier: 20, delayMs, bubbleWidth: 140, gap: 4, margin: 8 });

  const createPopEffect = () => {
    let bubbleSize = 140;
    if (isExpanded) bubbleSize = 160;
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
  
  let bubbleSize = 140;
  if (isExpanded) bubbleSize = 280;
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  // Color based on score (lower is better for volatility)
  const getScoreColor = () => {
    if (score <= 30) return '#10b981'; // green - stable
    if (score <= 60) return '#f59e0b'; // orange - moderate
    return '#ef4444'; // red - volatile
  };

  const scoreColor = getScoreColor();
  
  const bubble = (
    <div
      ref={containerRef}
      className={`absolute z-50 pointer-events-auto transition-all duration-1000 ease-in-out ${
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
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: `0 0 30px ${scoreColor}, inset 0 0 20px ${scoreColor}33`}}>
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: `0 0 25px ${scoreColor}, 0 0 50px ${scoreColor}4d`}}></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-transparent to-white/5 animate-pulse" style={{animationDuration: '3s'}}></div>
        
        <div className="absolute inset-4 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center text-center relative">
            {!isExpanded ? (
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-0 shadow-none bg-transparent flex items-center justify-center" style={{backgroundColor: `${scoreColor}20`}}>
                    <Activity size={20} style={{color: scoreColor}} />
                  </div>
                </div>
                <div className="text-center">
                  
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col p-4">
                <div className="text-center mb-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-0 shadow-none bg-transparent mx-auto mb-2 flex items-center justify-center" style={{backgroundColor: `${scoreColor}20`}}>
                    <Activity size={36} style={{color: scoreColor}} />
                  </div>
                  <div className="text-[12px] font-bold" style={{color: scoreColor}}>{tokenName}</div>
                </div>
                
                <div className="flex-1 px-4 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-white/90 leading-tight space-y-2">
                      <div className="text-[20px] font-bold mb-2" style={{color: scoreColor}}>{score.toFixed(1)}/100</div>
                      <p className="text-center text-[11px] font-semibold" style={{color: scoreColor}}>
                        {score <= 30 && "Low volatility - Stable price"}
                        {score > 30 && score <= 60 && "Moderate volatility"}
                        {score > 60 && "High volatility - Price swings"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  return bubble;
};

FloatingVolatilityScoreBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  score: PropTypes.number,
  tokenName: PropTypes.string,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingVolatilityScoreBubble;
