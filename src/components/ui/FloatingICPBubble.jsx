import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle, AlertCircle, Loader, Wifi, WifiOff, Shield, User } from 'lucide-react';
import icpLogo from '../../assets/icp-logo.png';

const FloatingICPBubble = ({ isOpen, onClose, title = 'ICP Status', content = '', loading = false, status = 'error', addParticlesToSwarm }) => {
  const bubbleId = useState(() => `icp-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
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

  // Create pop particles and add them to main swarm
  const createPopEffect = () => {
    // Dynamic bubble size based on expanded state
    let bubbleSize = 140; // Base collapsed size
    if (isExpanded) {
      bubbleSize = 320; // Fixed size for visual status display
    }
    const bubbleCenter = {
      x: position.x + bubbleSize / 2, // Actual bubble center
      y: position.y + bubbleSize / 2  // Actual bubble center
    };

    if (addParticlesToSwarm) {
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
    }
    
    // Close bubble after pop animation starts
    setTimeout(() => {
      onClose();
    }, 100);
  };

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
  
  // Color scheme based on status
  const colors = {
    error: {
      border: 'border-red-400',
      shadow: '0 0 20px #ef4444, inset 0 0 10px rgba(239, 68, 68, 0.2)',
      glowBorder: 'border-red-300',
      glowShadow: '0 0 15px #ef4444'
    },
    success: {
      border: 'border-green-400',
      shadow: '0 0 20px #22c55e, inset 0 0 10px rgba(34, 197, 94, 0.2)',
      glowBorder: 'border-green-300',
      glowShadow: '0 0 15px #22c55e'
    },
    connecting: {
      border: 'border-blue-400',
      shadow: '0 0 20px #3b82f6, inset 0 0 10px rgba(59, 130, 246, 0.2)',
      glowBorder: 'border-blue-300',
      glowShadow: '0 0 15px #3b82f6'
    }
  };

  const theme = colors[status] || colors.error;
  
  // Dynamic bubble size based on content length and expanded state
  let bubbleSize = 140; // Base collapsed size (half of original)
  if (isExpanded) {
    // Fixed size for visual status display - no scrolling needed
    bubbleSize = 160; // Optimized size for icon-based content (half of original)
  }
  
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  // Scale factor for all internal elements (0.5 = half size)
  const scale = bubbleSize / 140; // Original was 140px
  
  const bubble = (
    <div 
      ref={containerRef}
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-150 ease-in-out'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleWidth}px`,
        height: `${bubbleHeight}px`,
        zIndex: 2147483645, // Lower than others
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="icp"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{border: `${Math.max(1, scale * 2)}px solid #4ade80`, boxShadow: `0 0 ${scale * 30}px #4ade80, inset 0 0 ${scale * 20}px rgba(74, 222, 128, 0.15)`}}>
        {/* Enhanced neon green glowing border effect */}
        <div className="absolute inset-0 rounded-full animate-pulse" style={{border: `${Math.max(0.5, scale)}px solid rgba(134, 239, 172, 0.6)`, boxShadow: `0 0 ${scale * 25}px #4ade80, 0 0 ${scale * 50}px rgba(74, 222, 128, 0.3)`}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-green-500/5 via-transparent to-green-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        
        {/* Spherical Content Area */}
        <div className="absolute flex items-center justify-center" style={{inset: `${scale * 16}px`}}>
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="rounded-full overflow-hidden border-green-400 shadow-lg shadow-green-500/40 bg-transparent" style={{width: `${scale * 40}px`, height: `${scale * 40}px`, border: `${Math.max(1, scale * 2)}px solid #4ade80`, marginBottom: `${scale * 8}px`}}>
                <img 
                  src={icpLogo} 
                  alt="ICP Logo" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center justify-center" style={{gap: `${scale * 4}px`, marginBottom: `${scale * 4}px`}}>
                <div className="bg-green-400 rounded-full animate-bounce" style={{width: `${scale * 8}px`, height: `${scale * 8}px`}}></div>
                <div className="bg-green-400 rounded-full animate-bounce" style={{width: `${scale * 8}px`, height: `${scale * 8}px`, animationDelay: '0.1s'}}></div>
                <div className="bg-green-400 rounded-full animate-bounce" style={{width: `${scale * 8}px`, height: `${scale * 8}px`, animationDelay: '0.2s'}}></div>
              </div>
              <div className="font-semibold text-green-400" style={{fontSize: `${scale * 12}px`}}>Loading...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Just icon
                <div className="flex flex-col items-center justify-center">
                  <div className="w-10 h-10">
                    <img 
                      src={icpLogo} 
                      alt="ICP Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                // Expanded: Smaller text and icons to fit
                <div className="w-full h-full relative flex flex-col items-center p-3">
                  {/* Top section - Icon and title */}
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full overflow-hidden border-0 shadow-none bg-transparent shadow-green-500/40 bg-transparent">
                      <img 
                        src={icpLogo} 
                        alt="ICP Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[8px] font-bold text-green-300">{title}</div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 mt-16 px-2">
                    <div className="text-center space-y-1">
                      {(() => {
                        if (typeof content !== 'string') return null;
                        
                        const isConnected = content.includes('Connected');
                        const isError = content.includes('Error') || status === 'error';
                        const backendActive = content.includes('Backend: Active');
                        const isAuthenticated = content.includes('Auth: Authenticated');
                        const hasPrincipal = content.includes('Principal:') && !content.includes('Principal: None');
                        
                        return (
                          <div className="space-y-1">
                            {/* Main Status */}
                            <div className="flex items-center justify-center gap-1">
                              {isConnected ? (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              ) : isError ? (
                                <AlertCircle className="w-3 h-3 text-red-400" />
                              ) : (
                                <Loader className="w-3 h-3 text-yellow-400 animate-spin" />
                              )}
                              <span className={`font-bold text-[8px] ${isConnected ? 'text-green-400' : isError ? 'text-red-400' : 'text-yellow-400'}`}>
                                {isConnected ? 'Connected' : isError ? 'Error' : 'Connecting'}
                              </span>
                            </div>
                            
                            {/* Backend */}
                            <div className="flex items-center justify-center gap-1">
                              {backendActive ? (
                                <Wifi className="w-2 h-2 text-green-400" />
                              ) : (
                                <WifiOff className="w-2 h-2 text-orange-400" />
                              )}
                              <span className={`text-[7px] ${backendActive ? 'text-green-300' : 'text-orange-300'}`}>
                                Backend: {backendActive ? 'Active' : 'Offline'}
                              </span>
                            </div>
                            
                            {/* Auth */}
                            <div className="flex items-center justify-center gap-1">
                              <Shield className={`w-2 h-2 ${isAuthenticated ? 'text-green-400' : 'text-blue-400'}`} />
                              <span className={`text-[7px] ${isAuthenticated ? 'text-green-300' : 'text-blue-300'}`}>
                                Auth: {isAuthenticated ? 'Yes' : 'No'}
                              </span>
                            </div>
                            
                            {/* Principal */}
                            {hasPrincipal && (
                              <div className="flex items-center justify-center gap-1">
                                <User className="w-2 h-2 text-blue-400" />
                                <span className="text-[7px] text-blue-300">
                                  Principal: Yes
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
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

FloatingICPBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  status: PropTypes.oneOf(['error', 'success', 'connecting']),
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingICPBubble;
