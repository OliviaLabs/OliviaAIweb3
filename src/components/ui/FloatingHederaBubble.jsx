import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import useFloatToTop from '../../hooks/useFloatToTop';
import ReactMarkdown from 'react-markdown';
import hederaLogo from '../../assets/hedera-logo.png';

const FloatingHederaBubble = ({ isOpen, onClose, title = 'Hedera', content = '', loading = false }) => {
  const bubbleId = useState(() => `hedera-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
  const [position, setPosition] = useState(() => {
    // Spread bubbles across the bottom third of screen
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100; // Random between bottom 100-400px
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  // Remove auto-floating (replaced by universal float hook)
  useEffect(() => { return undefined; }, [isOpen, isDragging, isExpanded]);
  useFloatToTop({ isOpen, isDragging, isExpanded, position, setPosition, topBarrier: 20, speed: 0.6 });

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
    }
  };

  const handleClick = (e) => {
    // Don't toggle if clicking close button
    if (e.target.getAttribute('aria-label') === 'Close') return;
    
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

  const collapsedSize = 140;
  const maxExpandedSize = 300;
  
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
        zIndex: 2147483644, // Lower than others
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'top 4800ms linear'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="hedera"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #4ade80, inset 0 0 20px rgba(74, 222, 128, 0.15)'}}>
        {/* Enhanced neon green glowing border effect */}
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: '0 0 25px #4ade80, 0 0 50px rgba(74, 222, 128, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-green-500/5 via-transparent to-green-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>
        
        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-0 shadow-none bg-transparent shadow-green-500/40 mb-2 bg-transparent">
                <img 
                  src={hederaLogo} 
                  alt="Hedera Logo" 
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
            <div className="text-white w-full h-full flex items-center justify-center text-center">
              {!isExpanded ? (
                // Collapsed: Unified 80px circular icon
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-0 shadow-none bg-transparent">
                    <img 
                      src={hederaLogo} 
                      alt="Hedera Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                // Expanded: Centered content with consistent padding
                <div className="w-full h-full flex flex-col justify-center items-center px-4 pt-6 pb-4">
                  {/* Header section with logo and title */}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-0 shadow-2xl shadow-green-500/60 bg-transparent">
                      <img 
                        src={hederaLogo} 
                        alt="Hedera Logo" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-green-400/10 to-green-300/20"></div>
                    </div>
                    <div className="text-sm font-bold text-green-300 drop-shadow-lg">{title}</div>
                    <div className="text-xs text-white/70 font-medium">Hashgraph Network</div>
                  </div>
                  
                  {/* Central content area - scrollable and centered */}
                  <div className="flex-1 px-6 py-4 overflow-y-auto flex items-center justify-center">
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
                        <div className="font-mono text-xs text-green-300 bg-black/30 p-3 rounded border-0/30">
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

FloatingHederaBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
};

export default FloatingHederaBubble;
