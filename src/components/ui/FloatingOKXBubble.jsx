import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { log, error as logError } from '../../utils/logger.js';
import okxLogo from '../../assets/OKx.png';

// OKX DEX Trading Parameter Extraction Service
const extractTradingParameters = async (input) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/openai/extract-trading`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success ? data.data.extracted_parameters : null;
  } catch (error) {
    logError('Failed to extract trading parameters:', error);
    return null;
  }
};

// OKX DEX Service
const okxDexService = {
  async getSupportedChains() {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/okx/chains`, {
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
      logError('Failed to fetch OKX supported chains:', error);
      return null;
    }
  },

  async getQuote(chainId, fromTokenAddress, toTokenAddress, amount, slippage = 0.5) {
    try {
      const url = new URL(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/okx/quote`);
      url.searchParams.append('chainId', chainId);
      url.searchParams.append('fromTokenAddress', fromTokenAddress);
      url.searchParams.append('toTokenAddress', toTokenAddress);
      url.searchParams.append('amount', amount);
      url.searchParams.append('slippage', slippage);

      const response = await fetch(url.toString(), {
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
      logError('Failed to get OKX quote:', error);
      return null;
    }
  },

  async getOliviaQuote(userQuery) {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/okx/olivia-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || 'dev-token'}`
        },
        body: JSON.stringify({ userQuery })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get OKX Olivia quote:', error);
      return null;
    }
  }
};

const FloatingOKXBubble = ({ isOpen, onClose, title = 'OKX DEX', content = '', loading = false, addParticlesToSwarm, originalQuery = '', transactionData = null }) => {
  const bubbleId = useState(() => `okx-${Date.now()}-${Math.random()}`)[0];
  const [position, setPosition] = useState(() => {
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100;
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [supportedChains, setSupportedChains] = useState([]);
  const [quote, setQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Remove auto-floating
  useEffect(() => { return undefined; }, [isOpen, isDragging, isExpanded]);

  useEffect(() => {
    // Add flag to prevent duplicate calls in React StrictMode
    let mounted = true;
    
    if (isOpen && mounted) {
      // Only load chains once
      if (!supportedChains.length) {
        loadSupportedChains();
      }
      // Automatically get quote when bubble opens if we have an original query
      if (originalQuery && !isLoadingQuote) {
        getQuote();
      }
    }
    
    return () => {
      mounted = false;
    }
  }, [isOpen]); // Remove originalQuery from deps to prevent re-runs

  const loadSupportedChains = async () => {
    try {
      const chains = await okxDexService.getSupportedChains();
      if (chains) {
        setSupportedChains(chains);
      }
    } catch (error) {
      logError('Failed to load OKX supported chains:', error);
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.bubble-content')) return;
    
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

    let bubbleSize = 140; // Halved
    if (isExpanded) bubbleSize = 160; // Halved

    setPosition({
      x: Math.max(50, Math.min(window.innerWidth - bubbleSize - 50, newX)),
      y: Math.max(50, Math.min(window.innerHeight - bubbleSize - 50, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
          color: '#3b82f6' // Blue for OKX
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

  const handleClose = (e) => {
    e.stopPropagation();
    onClose();
  };

  const getQuote = async () => {
    setIsLoadingQuote(true);
    try {
      // Use the original user query to get a real quote
      let userQuery = originalQuery;
      
      // If no originalQuery provided, try to extract from content
      if (!userQuery) {
        log('No originalQuery prop, extracting from content...');
        // Try to extract from content first (look for patterns like "Buy", "Swap", etc.)
        const buyMatch = content.match(/Buy[:\s]+([^.]*)/i);
        const swapMatch = content.match(/Swap[:\s]+([^.]*)/i);
        const sellMatch = content.match(/Sell[:\s]+([^.]*)/i);
        const tradeMatch = content.match(/Trade[:\s]+([^.]*)/i);
        
        if (buyMatch) userQuery = `Buy ${buyMatch[1].trim()}`;
        else if (swapMatch) userQuery = `Swap ${swapMatch[1].trim()}`;
        else if (sellMatch) userQuery = `Sell ${sellMatch[1].trim()}`;
        else if (tradeMatch) userQuery = `Trade ${tradeMatch[1].trim()}`;
        else {
          // Fallback to title if it contains meaningful info
          userQuery = title && title !== 'OKX DEX' ? title : 'Ethereum swap';
        }
      }
      
      log('💡 Getting OKX quote for user query:', userQuery);
      
      // Use the Olivia quote endpoint which handles parameter extraction and gets real quotes
      const oliviaQuote = await okxDexService.getOliviaQuote(userQuery);
      
      if (oliviaQuote) {
        setQuote(oliviaQuote);
        log('✅ OKX quote received:', oliviaQuote);
      } else {
        log('❌ No quote received from OKX');
        // Set a fallback quote if none received
        setQuote({
          error: 'Unable to get quote from OKX DEX',
          oliviaMessage: 'Sorry, I couldn\'t get a quote for that swap right now. The OKX DEX might be temporarily unavailable.'
        });
      }
    } catch (error) {
      logError('Failed to get OKX quote:', error);
      setQuote({
        error: 'Failed to get quote',
        oliviaMessage: 'Oops! There was an error getting your quote. Please try again later.'
      });
    } finally {
      setIsLoadingQuote(false);
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

  // Dynamic bubble size based on content length and expanded state
  let bubbleSize = 140; // Base collapsed size (halved)
  if (isExpanded) {
    bubbleSize = 160; // Fixed expanded size
  }
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  // Scale factor for all internal elements
  const scale = bubbleSize / 140; // Original was 140px

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
                  src={okxLogo} 
                  alt="OKX Logo" 
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
            <div className="text-white w-full h-full flex flex-col items-center justify-center text-center">
              {!isExpanded ? (
                // Collapsed: Central icon with title below
                <div className="flex flex-col items-center justify-center">
                  <div className="relative" style={{marginBottom: `${scale * 12}px`}}>
                    <div className="rounded-full overflow-hidden border-blue-400 shadow-2xl shadow-blue-500/60 bg-gradient-to-br from-blue-400/30 to-blue-600/40 hover:border-blue-300 transition-all duration-300 hover:shadow-blue-400/80 hover:scale-105 group" style={{width: `${scale * 40}px`, height: `${scale * 40}px`, border: `${Math.max(2, scale * 4)}px solid #3b82f6`}}>
                      <img 
                        src={okxLogo} 
                        alt="OKX Logo" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-blue-400/10 to-blue-300/20"></div>
                    </div>
                    <div className="absolute inset-0 rounded-full border-blue-300/40 animate-ping" style={{border: `${Math.max(1, scale * 2)}px solid rgba(147, 197, 253, 0.4)`, animationDuration: '3s'}}></div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-300 drop-shadow-xl" style={{fontSize: `${scale * 12}px`}}>{title}</div>
                  </div>
                </div>
            ) : (
              // Expanded: Smaller text and icons to fit
              <div className="w-full h-full flex flex-col p-2">
                <div className="text-center mb-1">
                  <div className="w-6 h-6 rounded-full overflow-hidden border-0 shadow-none bg-transparent shadow-blue-500/40 bg-transparent">
                    <img 
                      src={okxLogo} 
                      alt="OKX Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[8px] font-bold text-blue-300">{title}</div>
                </div>
                
                {/* Content */}
                <div className="flex-1 px-2 overflow-y-auto">
                  <div className="text-center space-y-1">
                    {typeof content === 'string' ? (
                      <div className="text-[7px] text-white/90 leading-tight space-y-1">
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
                      <div className="font-mono text-xs text-blue-300 bg-black/30 p-2 rounded border-0/30">
                        <pre className="whitespace-pre-wrap text-left text-xs">
                          {JSON.stringify(content, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supported chains display */}
                {supportedChains.length > 0 && (
                  <div className="mt-1 mb-1">
                    <div className="text-xs text-blue-300 font-semibold mb-1">Chains:</div>
                    <div className="flex flex-wrap gap-1 justify-center max-h-12 overflow-y-auto">
                      {supportedChains.slice(0, 4).map((chain, index) => (
                        <span 
                          key={index}
                          className="bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded-full text-xs border-0/30"
                        >
                          {chain.name || chain.chainId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}


                {/* Quote display */}
                {quote && (
                  <div className="mt-2 p-2 bg-blue-500/10 rounded border-0/30 text-xs">
                    <div className="text-blue-300 font-semibold mb-1">OKX Quote:</div>
                    {quote.oliviaMessage && (
                      <div className="text-white/90 mb-2 italic">"{quote.oliviaMessage}"</div>
                    )}
                    {quote.quote && (
                      <div className="space-y-1">
                        <div className="text-white/80">
                          <span className="font-semibold">From:</span> {quote.quote.fromToken?.symbol || 'Unknown'}
                        </div>
                        <div className="text-white/80">
                          <span className="font-semibold">To:</span> {quote.quote.toToken?.symbol || 'Unknown'}
                        </div>
                        <div className="text-white/80">
                          <span className="font-semibold">Amount:</span> {quote.quote.amount || 'N/A'}
                        </div>
                        <div className="text-white/80">
                          <span className="font-semibold">Rate:</span> {quote.quote.rate || 'N/A'}
                        </div>
                        {quote.quote.price && (
                          <div className="text-white/80">
                            <span className="font-semibold">Price:</span> {quote.quote.price}
                          </div>
                        )}
                        {quote.quote.slippage && (
                          <div className="text-white/80">
                            <span className="font-semibold">Slippage:</span> {quote.quote.slippage}%
                          </div>
                        )}
                      </div>
                    )}
                    {quote.error && (
                      <div className="text-red-300 text-xs">
                        Error: {quote.error}
                      </div>
                    )}
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

FloatingOKXBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
  originalQuery: PropTypes.string,
  transactionData: PropTypes.object
};

export default FloatingOKXBubble;
