import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { log, error as logError } from '../../utils/logger.js';
import zeroXLogo from '../../assets/0x-logo.png';

// 0x Protocol Trading Parameter Extraction Service
const extractTradingParameters = async (input) => {
  try {
    const response = await fetch('http://localhost:3001/api/openai/extract-trading', {
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
    logError('🚨 Failed to extract trading parameters:', error);
    return null;
  }
};

const FloatingZeroXBubble = ({ isOpen, onClose, title = '0x Protocol', content = '', loading = false, addParticlesToSwarm, originalQuery = '' }) => {
  const bubbleId = useState(() => `zerox-${Date.now()}-${Math.random()}`)[0]; // Unique ID for this bubble instance
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

  useEffect(() => {
    if (!isOpen || isDragging) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        // Dynamic bubble size based on expanded state
        let bubbleSize = 140; // Base collapsed size
        if (isExpanded) {
          bubbleSize = 380; // Expanded size
        }
        const bubbleHeight = bubbleSize;
        
        // Only float if not dragging and not at top
        if (prev.y > 50) {
          return { ...prev, y: prev.y - 0.3 }; // Slower, smoother float
        }
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isDragging, isExpanded]);

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
          color: '#8B00FF' // Purple for 0x Protocol
        });
      }
      
      addParticlesToSwarm(newParticles);
    }
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
  
  // Dynamic bubble size based on content length and expanded state
  let bubbleSize = 140; // Base collapsed size - slightly bigger for the new design
  if (isExpanded && typeof content === 'string') {
    // Calculate size based on content length
    const lines = content.split('\n').length;
    const avgLineLength = content.length / lines;
    const estimatedWidth = Math.max(320, Math.min(480, avgLineLength * 8 + 140));
    const estimatedHeight = Math.max(280, lines * 22 + 120);
    bubbleSize = Math.max(estimatedWidth, estimatedHeight);
  } else if (isExpanded) {
    bubbleSize = 380; // Default expanded size - slightly bigger
  }
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  const bubble = (
    <div 
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-150 ease-in-out'}`}
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
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-purple-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #a855f7, inset 0 0 20px rgba(168, 85, 247, 0.15)'}}>
        {/* Enhanced neon purple glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-purple-300/60 animate-pulse" style={{boxShadow: '0 0 25px #a855f7, 0 0 50px rgba(168, 85, 247, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-500/5 via-transparent to-purple-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Enhanced close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-300 text-xs font-bold flex items-center justify-center border border-purple-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30"
          aria-label="Close"
        >
          ×
        </button>

        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400 shadow-lg shadow-purple-500/40 mb-2 bg-black/20">
                <img 
                  src={zeroXLogo} 
                  alt="0x Protocol Logo" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-purple-400">Loading...</div>
            </div>
          ) : (
            <div className="text-white w-full h-full flex flex-col items-center justify-center text-center">
              {!isExpanded ? (
                // Collapsed: Central icon with title below in spherical layout
                <div className="flex flex-col items-center justify-center">
                  {/* Central 0x Icon */}
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-4 border-purple-400 shadow-2xl shadow-purple-500/60 bg-gradient-to-br from-purple-400/30 to-purple-600/40 hover:border-purple-300 transition-all duration-300 hover:shadow-purple-400/80 hover:scale-105 group">
                      <img 
                        src={zeroXLogo} 
                        alt="0x Protocol Logo" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Inner circular glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-purple-400/10 to-purple-300/20"></div>
                    </div>
                    {/* Pulsing outer ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-purple-300/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  {/* Circular text layout */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-purple-300 drop-shadow-xl">{title}</div>
                  </div>
                </div>
            ) : (
              // Expanded: Spherical layout with enhanced content
              <div className="w-full h-full flex flex-col">
                {/* Header section with logo and title */}
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-4 border-purple-400 shadow-2xl shadow-purple-500/60 bg-gradient-to-br from-purple-400/30 to-purple-600/40 mx-auto mb-2">
                    <img 
                      src={zeroXLogo} 
                      alt="0x Protocol Logo" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-purple-400/10 to-purple-300/20"></div>
                  </div>
                  <div className="text-sm font-bold text-purple-300 drop-shadow-lg">{title}</div>
                  <div className="text-xs text-white/70 font-medium">DEX Protocol</div>
                </div>
                
                {/* Central content area - improved text flow */}
                <div className="flex-1 px-4 py-2 overflow-y-auto max-h-[200px]">
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
                      <div className="font-mono text-xs text-purple-300 bg-black/30 p-2 rounded border border-purple-400/30">
                        <pre className="whitespace-pre-wrap text-left text-xs">
                          {JSON.stringify(content, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                {/* Enhanced Swap button - bigger and more clickable */}
                {(content.includes('swap') || content.includes('trade') || content.includes('exchange') || content.includes('0x')) && (
                  <div className="mt-4 mb-2 flex justify-center">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        log('🔄 0x Swap button clicked!');
                        
                        // Check if we have transaction data stored in the bubble
                        if (transactionData) {
                          log('💰 Executing swap with transaction data:', transactionData);
                          
                          try {
                            // Here you would execute the actual swap transaction
                            // For now, let's just show the transaction details
                            alert(`Swap ready to execute!\n\nSell: ${transactionData.sellAmount} ${transactionData.formattedSwap?.sellTokenInfo?.symbol}\nBuy: ~${transactionData.buyAmount} ${transactionData.formattedSwap?.buyTokenInfo?.symbol}\n\nClick OK to proceed with wallet confirmation.`);
                            
                            // TODO: Integrate with wallet to execute the transaction
                            // const result = await executeTransaction(transactionData);
                            
                          } catch (error) {
                            console.error('❌ Swap execution failed:', error);
                            alert('Swap failed: ' + error.message);
                          }
                          return;
                        }
                        
                        // Fallback to Matcha redirect if no transaction data
                        log('⚠️ No transaction data found, redirecting to Matcha...');
                        let url = 'https://matcha.xyz/';
                        
                        try {
                          // Extract the original user query - prioritize originalQuery prop
                          let userQuery = originalQuery;
                          log('🔍 Initial userQuery from originalQuery prop:', userQuery);
                          
                          // If no originalQuery provided, try to extract from content
                          if (!userQuery) {
                            log('⚠️ No originalQuery prop, extracting from content...');
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
                              userQuery = title && title !== '0x Protocol' ? title : 'Ethereum swap';
                            }
                          }
                          
                          log('💡 Final userQuery for parameter extraction:', userQuery);
                          
                          // Use OpenAI to extract trading parameters
                          const extractedParams = await extractTradingParameters(userQuery);
                          log('🤖 OpenAI extracted parameters:', extractedParams);
                          
                          if (extractedParams) {
                            const { sellToken, buyToken, amount } = extractedParams;
                            
                            // Build Matcha URL with parameters
                            const urlParams = new URLSearchParams();
                            
                            if (sellToken && sellToken.toLowerCase() !== 'unknown') {
                              urlParams.append('sellToken', sellToken.toUpperCase());
                            }
                            if (buyToken && buyToken.toLowerCase() !== 'unknown') {
                              urlParams.append('buyToken', buyToken.toUpperCase());
                            }
                            if (amount && amount !== 'unknown') {
                              urlParams.append('sellAmount', amount);
                            }
                            
                            if (urlParams.toString()) {
                              url = `https://matcha.xyz/trade?${urlParams.toString()}`;
                            }
                            
                            log('🎯 Built Matcha URL with parameters:', url);
                          } else {
                            log('⚠️ No parameters extracted, using default Matcha URL');
                          }
                          
                        } catch (paramError) {
                          logError('🚨 Error extracting parameters:', paramError);
                          log('📍 Falling back to default Matcha URL');
                        }
                        
                        // Open the URL
                        log('🌐 Opening URL:', url);
                        if (window.handleUrlClick) {
                          window.handleUrlClick(url);
                        } else {
                          window.open(url, '_blank');
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-purple-400/50"
                    >
                      🔄 Swap on Matcha
                    </button>
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

FloatingZeroXBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
  originalQuery: PropTypes.string,
};

export default FloatingZeroXBubble;