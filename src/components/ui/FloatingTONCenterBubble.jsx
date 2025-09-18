import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { log, error as logError } from '../../utils/logger.js';
import tonLogo from '/toncoin-ton-logo.svg';

// TON Center Service
const tonCenterService = {
  async getAccountInfo(address) {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/ton/account/${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || 'dev-token'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get TON account info:', error);
      return null;
    }
  },

  async getAccountBalance(address) {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/ton/balance/${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || 'dev-token'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get TON account balance:', error);
      return null;
    }
  },

  async getAccountTransactions(address, limit = 5) {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/ton/transactions/${address}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || 'dev-token'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get TON account transactions:', error);
      return null;
    }
  },

  async getJettonBalances(address) {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/ton/jettons/${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || 'dev-token'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get TON jetton balances:', error);
      return null;
    }
  },

  async getTONPrice() {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/ton/price`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || 'dev-token'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get TON price:', error);
      return null;
    }
  },

  async getPopularJettons() {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/ton/popular-jettons`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || 'dev-token'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get popular TON jettons:', error);
      return null;
    }
  }
};

const FloatingTONCenterBubble = ({ isOpen, onClose, title = 'TON Center', content = '', loading = false, addParticlesToSwarm, originalQuery = '', transactionData = null }) => {
  const bubbleId = useState(() => `ton-${Date.now()}-${Math.random()}`)[0];
  const [position, setPosition] = useState(() => {
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100;
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [accountData, setAccountData] = useState(null);
  const [tonPrice, setTonPrice] = useState(null);
  const [popularJettons, setPopularJettons] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (!isOpen || isDragging) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        // Dynamic bubble size based on expanded state
        let bubbleSize = 140; // Base collapsed size
        if (isExpanded) {
          bubbleSize = 320; // Smaller expanded size
        }
        const bubbleHeight = bubbleSize;
        
        // Only float if not dragging and not at top
        if (prev.y > 50) {
          return { ...prev, y: prev.y - 1 }; // Smooth continuous float
        }
        return prev;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isOpen, isDragging, isExpanded]);

  useEffect(() => {
    let mounted = true;
    
    if (isOpen && !isLoadingData) {
      // Prevent duplicate calls
      const loadData = async () => {
        if (mounted) {
          await loadTONData();
        }
      };
      loadData();
    }
    
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const loadTONData = async () => {
    setIsLoadingData(true);
    
    // REAL API CALL - Use centralized CoinGecko service
    try {
      const { coingeckoService } = await import('../../api');
      const priceData = await coingeckoService.getPrices(['the-open-network']);
      
      if (priceData && priceData['the-open-network']) {
        setTonPrice({ 
          price: priceData['the-open-network'].usd.toFixed(2), 
          currency: 'USD' 
        });
      } else {
        setTonPrice({ price: 'API Error', currency: '' });
      }
    } catch (error) {
      console.error('TON Price API failed:', error);
      setTonPrice({ price: 'Failed to load', currency: '' });
    }
    
    // REAL TON CENTER API CALL - Skip if no API key
    try {
      // Only call if we have an API key configured
      const response = await tonCenterService.getPopularJettons();
      if (response && response.jettons) {
        setPopularJettons(response.jettons);
      } else {
        // Don't show error, just skip jettons
        setPopularJettons([]);
      }
    } catch (error) {
      // Silently fail for TON Center - it's optional
      console.log('TON Center API not configured or failed (optional)');
      setPopularJettons([]);
    }
    
    setIsLoadingData(false);
  };

  const createPopEffect = () => {
    if (addParticlesToSwarm) {
      const numParticles = 8;
      const newParticles = [];
      
      for (let i = 0; i < numParticles; i++) {
        newParticles.push({
          id: `particle-${Date.now()}-${i}`,
          x: position.x + 70, // Center of bubble
          y: position.y + 70,
          vx: (Math.random() - 0.5) * 8, // Random velocity
          vy: (Math.random() - 0.5) * 8,
          size: Math.random() * 6 + 4,
          life: 1.0,
          decay: 0.02,
          color: '#0088cc' // TON blue
        });
      }
      
      addParticlesToSwarm(newParticles);
    }
    
    // Close the bubble after particle effect
    setTimeout(() => {
      onClose();
    }, 100);
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

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left mouse button
    
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

  const handleClose = (e) => {
    e.stopPropagation();
    onClose();
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
  let bubbleSize = 140; // Base collapsed size
  if (isExpanded && typeof content === 'string') {
    // Calculate size based on content length - more conservative sizing
    const lines = content.split('\n').length;
    const avgLineLength = content.length / lines;
    const estimatedWidth = Math.max(300, Math.min(400, avgLineLength * 6 + 120));
    const estimatedHeight = Math.max(250, lines * 18 + 100);
    bubbleSize = Math.max(estimatedWidth, estimatedHeight);
  } else if (isExpanded) {
    bubbleSize = 320; // Smaller default expanded size
  }
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;

  const bubble = (
    <div 
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        zIndex: isExpanded ? 1001 : 1000,
        width: `${bubbleWidth}px`,
        height: `${bubbleHeight}px`
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-blue-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #0088cc, inset 0 0 20px rgba(0, 136, 204, 0.15)'}}>
        {/* Enhanced neon blue glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-blue-300/60 animate-pulse" style={{boxShadow: '0 0 25px #0088cc, 0 0 50px rgba(0, 136, 204, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-500/5 via-transparent to-blue-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Enhanced close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-75 text-xs font-bold flex items-center justify-center border border-blue-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30 hover:scale-110 active:scale-95"
          aria-label="Close"
        >
          ×
        </button>

        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading && !tonPrice && !popularJettons.length ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-400 shadow-lg shadow-blue-500/40 mb-2 bg-black/20">
                <img 
                  src={tonLogo} 
                  alt="TON Logo" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-blue-400">Loading TON data...</div>
            </div>
          ) : (
            <div className="text-white w-full h-full flex flex-col items-center justify-center text-center">
              {!isExpanded ? (
                // Collapsed: Central icon with title below in spherical layout
                <div className="flex flex-col items-center justify-center">
                  {/* Central TON Icon */}
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-4 border-blue-400 shadow-2xl shadow-blue-500/60 bg-gradient-to-br from-blue-400/30 to-blue-600/40 hover:border-blue-300 transition-all duration-75 hover:shadow-blue-400/80 hover:scale-110 active:scale-95 group">
                      <img 
                        src={tonLogo} 
                        alt="TON Logo" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-75"
                      />
                      {/* Inner circular glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-blue-400/10 to-blue-300/20"></div>
                    </div>
                    {/* Pulsing outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-blue-300/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  {/* Circular text layout */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-blue-300 drop-shadow-xl">{title}</div>
                    {tonPrice && (
                      <div className="text-xs text-white/70">${tonPrice.price || 'N/A'}</div>
                    )}
                  </div>
                </div>
            ) : (
              // Expanded: Spherical layout with enhanced content
              <div className="w-full h-full flex flex-col">
                {/* Header section with logo and title */}
                <div className="text-center mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-4 border-blue-400 shadow-2xl shadow-blue-500/60 bg-gradient-to-br from-blue-400/30 to-blue-600/40 mx-auto mb-2">
                    <img 
                      src={tonLogo} 
                      alt="TON Logo" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-blue-400/10 to-blue-300/20"></div>
                  </div>
                  <div className="text-sm font-bold text-blue-300 drop-shadow-lg">{title}</div>
                  <div className="text-xs text-white/70 font-medium">TON Blockchain</div>
                </div>
                
                {/* Central content area - improved text flow */}
                <div className="flex-1 px-3 py-2 overflow-y-auto max-h-[150px]">
                  <div className="text-center space-y-1">
                    {typeof content === 'string' ? (
                      <div className="text-xs text-white/90 leading-tight space-y-1">
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
                      <div className="font-mono text-xs text-blue-300 bg-black/30 p-2 rounded border border-blue-400/30">
                        <pre className="whitespace-pre-wrap text-left text-xs">
                          {JSON.stringify(content, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* TON Price Display */}
                {tonPrice && (
                  <div className="mt-1 mb-1">
                    <div className="text-xs text-blue-300 font-semibold mb-1">TON Price:</div>
                    <div className="text-white/80 text-xs">
                      ${tonPrice.price || 'N/A'} {tonPrice.currency || 'USD'}
                    </div>
                  </div>
                )}

                {/* Account Data Display */}
                {accountData && (
                  <div className="mt-1 mb-1">
                    <div className="text-xs text-blue-300 font-semibold mb-1">Account:</div>
                    <div className="text-white/80 text-xs">
                      Balance: {(parseInt(accountData.balance || 0) / 1000000000).toFixed(4)} TON
                    </div>
                  </div>
                )}

                {/* Popular Jettons Display */}
                {popularJettons.length > 0 && (
                  <div className="mt-1 mb-1">
                    <div className="text-xs text-blue-300 font-semibold mb-1">Popular Tokens:</div>
                    <div className="flex flex-wrap gap-1 justify-center max-h-12 overflow-y-auto">
                      {popularJettons.slice(0, 4).map((jetton, index) => (
                        <span 
                          key={index}
                          className="bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded-full text-xs border border-blue-400/30"
                        >
                          {jetton.symbol || jetton.name || 'Token'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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

FloatingTONCenterBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
  originalQuery: PropTypes.string,
  transactionData: PropTypes.object,
};

export default FloatingTONCenterBubble;
