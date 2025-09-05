import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const FloatingRubicBubble = ({ 
  id, 
  onClose, 
  initialPosition = { x: 100, y: 100 },
  initialExpanded = false 
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isFloating, setIsFloating] = useState(true);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const bubbleRef = useRef(null);
  const animationRef = useRef(null);

  // Floating animation
  useEffect(() => {
    if (!isFloating || isDragging) return;

    const animate = () => {
      setPosition(prev => ({
        x: prev.x + Math.sin(Date.now() * 0.001) * 0.5,
        y: prev.y + Math.cos(Date.now() * 0.0015) * 0.3
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isFloating, isDragging]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Import rubic service dynamically
        const { rubicService } = await import('../../api/services/rubic.service.js');
        
        const stats = await rubicService.getTradingStats();
        setData(stats);
      } catch (err) {
        console.error('Error loading Rubic data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Mouse event handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.bubble-content')) return;
    
    setIsDragging(true);
    setIsFloating(false);
    const rect = bubbleRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
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
    setIsFloating(true);
  };

  // Event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClose = () => {
    if (onClose) {
      onClose(id);
    }
  };

  if (isExpanded) {
    return (
      <div
        ref={bubbleRef}
        className="fixed z-50 select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative">
          {/* Main expanded bubble */}
          <div className="relative w-80 h-96 bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl border-2 border-purple-400/30 overflow-hidden">
            {/* Glowing border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-400/20 via-blue-500/20 to-indigo-600/20 animate-pulse"></div>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 hover:scale-110"
            >
              ×
            </button>

            {/* Header */}
            <div className="relative z-10 p-6 text-center">
              <div className="text-4xl mb-2">🔄</div>
              <h3 className="text-white font-bold text-lg mb-1">Rubic Protocol</h3>
              <p className="text-purple-200 text-sm">Cross-Chain Trading</p>
            </div>

            {/* Content */}
            <div className="relative z-10 px-6 pb-6 space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="text-white/70 text-sm mt-2">Loading...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              ) : data ? (
                <div className="space-y-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="text-purple-200 text-xs uppercase tracking-wide mb-1">Total Volume</div>
                    <div className="text-white font-bold text-lg">{data.totalVolume}</div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <div className="text-purple-200 text-xs uppercase tracking-wide mb-1">Total Trades</div>
                    <div className="text-white font-bold text-lg">{data.totalTrades}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                      <div className="text-purple-200 text-xs uppercase tracking-wide mb-1">Chains</div>
                      <div className="text-white font-bold text-sm">{data.supportedChains}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                      <div className="text-purple-200 text-xs uppercase tracking-wide mb-1">Tokens</div>
                      <div className="text-white font-bold text-sm">{data.supportedTokens}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/20 to-transparent p-4">
              <button
                onClick={handleToggleExpand}
                className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium py-2 px-4 rounded-xl transition-all duration-200"
              >
                Collapse
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={bubbleRef}
      className="fixed z-50 select-none cursor-move"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="relative">
        {/* Main collapsed bubble */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 rounded-full shadow-2xl border-2 border-purple-400/30 overflow-hidden">
          {/* Glowing border effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/20 via-blue-500/20 to-indigo-600/20 animate-pulse"></div>
          
          {/* Pulsing inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-300/30 via-blue-400/30 to-indigo-500/30 animate-pulse"></div>
          
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center text-2xl z-10">
            🔄
          </div>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-200 hover:scale-110 z-20"
          >
            ×
          </button>
        </div>

        {/* Click to expand hint */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Click to expand
          </div>
        </div>
      </div>

      {/* Click handler for expansion */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={handleToggleExpand}
      />
    </div>
  );
};

FloatingRubicBubble.propTypes = {
  id: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  initialPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  initialExpanded: PropTypes.bool
};

export default FloatingRubicBubble;
