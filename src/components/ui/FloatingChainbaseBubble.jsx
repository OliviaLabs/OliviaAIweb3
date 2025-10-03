import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { log, error as logError } from '../../utils/logger.js';
import chainbaseLogo from '../../assets/download-1.png';

// Chainbase Service
const chainbaseService = {
  async getSupportedChains() {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/chainbase/chains`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || '132fb6616283707bfb4e673e5ee6b4a3c199aa2dd2f214cdf72f920d1b6e70a7'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get supported chains:', error);
      return null;
    }
  },

  async getNetworkStats(chainId) {
    try {
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/chainbase/stats/${chainId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || '132fb6616283707bfb4e673e5ee6b4a3c199aa2dd2f214cdf72f920d1b6e70a7'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get network stats:', error);
      return null;
    }
  },

  async getLatestBlock(chainId) {
    try {
      // Get latest block - REAL API call
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/chainbase/latest-block?chainId=${chainId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || '132fb6616283707bfb4e673e5ee6b4a3c199aa2dd2f214cdf72f920d1b6e70a7'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get latest block:', error);
      return null;
    }
  },

  async getTokenPrice(chainId, contractAddress) {
    try {
      // Get token price - REAL API call
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/chainbase/token-price?chainId=${chainId}&contractAddress=${contractAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || '132fb6616283707bfb4e673e5ee6b4a3c199aa2dd2f214cdf72f920d1b6e70a7'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get token price:', error);
      return null;
    }
  },

  async getTransactions(chainId, address = null, limit = 5) {
    try {
      let url = `${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/chainbase/transactions?chainId=${chainId}&limit=${limit}`;
      if (address) {
        url += `&address=${address}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || '132fb6616283707bfb4e673e5ee6b4a3c199aa2dd2f214cdf72f920d1b6e70a7'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get transactions:', error);
      return null;
    }
  },

  async getTokenData(chainId, tokenAddress = null, limit = 5) {
    try {
      let url = `${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/chainbase/tokens?chainId=${chainId}&limit=${limit}`;
      if (tokenAddress) {
        url += `&tokenAddress=${tokenAddress}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_APP_ACCESS_TOKEN || '132fb6616283707bfb4e673e5ee6b4a3c199aa2dd2f214cdf72f920d1b6e70a7'}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      logError('Failed to get token data:', error);
      return null;
    }
  }
};

const FloatingChainbaseBubble = ({ isOpen, onClose, title = 'Chainbase', content = '', loading = false, addParticlesToSwarm, originalQuery = '', transactionData = null, detectedChain = 'ethereum' }) => {
  const bubbleId = useState(() => `chainbase-${Date.now()}-${Math.random()}`)[0];
  const [position, setPosition] = useState(() => {
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100;
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const positionRef = useState(position)[0];
  const draggingRef = useState(isDragging)[0];
  const expandedRef = useState(isExpanded)[0];
  const floatedRef = useRef(false);
  const [supportedChains, setSupportedChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState('1'); // Ethereum by default
  const [chainData, setChainData] = useState(null);
  const [defiData, setDefiData] = useState(null);
  const [apyData, setApyData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Remove auto-floating
  useEffect(() => { return undefined; }, [isOpen, isDragging, isExpanded]);

  // Gentle float-up on mount until top barrier
  useEffect(() => {
    if (!isOpen || floatedRef.current) return;
    let rafId;
    const topBarrier = 20;
    const step = () => {
      if (isDragging || isExpanded) return;
      const y = position.y;
      if (y <= topBarrier) {
        floatedRef.current = true;
        return;
      }
      setPosition(prev => ({ x: prev.x, y: Math.max(topBarrier, prev.y - 0.6) }));
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [isOpen, isDragging, isExpanded, position]);

  useEffect(() => {
    if (isOpen) {
      loadChainbaseData();
      // Set selected chain based on detected chain
      if (detectedChain === 'ton') setSelectedChain('ton');
      else if (detectedChain === 'sui') setSelectedChain('sui');
      else if (detectedChain === 'polygon') setSelectedChain('137');
      else if (detectedChain === 'bsc') setSelectedChain('56');
      else if (detectedChain === 'avalanche') setSelectedChain('43114');
      else if (detectedChain === 'arbitrum') setSelectedChain('42161');
      else if (detectedChain === 'optimism') setSelectedChain('10');
      else if (detectedChain === 'base') setSelectedChain('8453');
      else setSelectedChain('1'); // Default to Ethereum
    }
  }, [isOpen, detectedChain]);

  useEffect(() => {
    if (selectedChain) {
      loadChainData(selectedChain);
    }
  }, [selectedChain]);

  const loadChainbaseData = async () => {
    setIsLoadingData(true);
    try {
      // For now, we'll use static chain data since the API needs specific endpoints
      const chainList = [
        { name: 'Ethereum', chainId: '1' },
        { name: 'Polygon', chainId: '137' },
        { name: 'BSC', chainId: '56' },
        { name: 'Avalanche', chainId: '43114' },
        { name: 'Arbitrum', chainId: '42161' },
        { name: 'Optimism', chainId: '10' },
        { name: 'Base', chainId: '8453' }
      ];
      setSupportedChains(chainList);
    } catch (error) {
      logError('Failed to load Chainbase data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadChainData = async (chainId) => {
    setIsLoadingData(true);
    const chainName = getChainName(chainId);
    
    try {
      // Get REAL latest block data from Chainbase
      const blockData = await chainbaseService.getLatestBlock(chainId);
      
      if (blockData && blockData.data) {
        // Show REAL blockchain data
        setChainData({
          latestBlock: blockData.data.number || blockData.data,
          chainName: chainName,
          chainId: chainId,
          timestamp: new Date().toLocaleTimeString()
        });
      }
      
      // Also show some token prices (using well-known token addresses)
      const tokenAddresses = {
        '1': [ // Ethereum tokens
          { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USDC' },
          { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'USDT' },
          { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', name: 'DAI' }
        ],
        '137': [ // Polygon tokens
          { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', name: 'USDC' },
          { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', name: 'USDT' }
        ],
        '56': [ // BSC tokens
          { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', name: 'USDC' },
          { address: '0x55d398326f99059fF775485246999027B3197955', name: 'USDT' }
        ]
      };
      
      const tokens = tokenAddresses[chainId] || [];
      
      setApyData({
        [chainId]: {
          name: chainName,
          chainId: chainId,
          blockData: blockData?.data,
          tokens: tokens,
          message: `Real-time blockchain data from Chainbase`
        }
      });
    } catch (error) {
      logError('Failed to load chain data:', error);
      // Show error but with useful info
      setApyData({
        [chainId]: {
          name: chainName,
          chainId: chainId,
          error: true,
          message: 'Loading real data...'
        }
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const getChainName = (chainId) => {
    const chainNames = {
      '1': 'Ethereum',
      '137': 'Polygon', 
      '56': 'BSC',
      '43114': 'Avalanche',
      '42161': 'Arbitrum',
      '10': 'Optimism',
      '8453': 'Base',
      'ton': 'TON',
      'sui': 'Sui'
    };
    return chainNames[chainId] || 'Unknown Chain';
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
          color: '#00d4aa' // Chainbase green
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
  
  const collapsedSize = 140;
  const maxExpandedSize = 300;
  
  // Bubble ALWAYS stays circular - never bigger than screen
  const maxSize = Math.min(maxExpandedSize, window.innerWidth - 40, window.innerHeight - 100);
  const bubbleSize = isExpanded ? maxSize : collapsedSize;
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
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #00d4aa, inset 0 0 20px rgba(0, 212, 170, 0.15)'}}>
        {/* Enhanced neon green glowing border effect */}
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: '0 0 25px #00d4aa, 0 0 50px rgba(0, 212, 170, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-green-500/5 via-transparent to-green-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Spherical Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading && !apyData ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-0 shadow-none bg-transparent shadow-green-500/40 mb-2 bg-transparent">
                <img 
                  src={chainbaseLogo} 
                  alt="Chainbase Logo" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-green-400">Loading Chainbase data...</div>
            </div>
          ) : (
            <div className="text-white w-full h-full flex flex-col items-center justify-center text-center">
              {!isExpanded ? (
                // Collapsed: Central icon with title below in spherical layout
                <div className="flex flex-col items-center justify-center">
                  {/* Central Chainbase Icon */}
                  <div className="relative mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-0 shadow-2xl shadow-green-500/60 bg-transparent">
                      <img 
                        src={chainbaseLogo} 
                        alt="Chainbase Logo" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Inner circular glow */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-green-400/10 to-green-300/20"></div>
                    </div>
                    {/* Pulsing outer ring */}
                    <div className="absolute inset-0 rounded-full border-0/40 animate-ping" style={{animationDuration: '3s'}}></div>
                  </div>
                  
                  {/* Circular text layout */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-green-300 drop-shadow-xl">{title}</div>
                    <div className="text-xs text-white/70">Multi-Chain Data</div>
                  </div>
                </div>
            ) : (
              // Expanded: Centered content with consistent padding
              <div className="w-full h-full flex flex-col justify-center items-center px-4 pt-6 pb-4">
                {/* Header section with logo and title */}
                <div className="text-center mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-0 shadow-2xl shadow-green-500/60 bg-transparent">
                    <img 
                      src={chainbaseLogo} 
                      alt="Chainbase Logo" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-green-400/10 to-green-300/20"></div>
                  </div>
                  <div className="text-sm font-bold text-green-300 drop-shadow-lg">{title}</div>
                  <div className="text-xs text-white/70 font-medium">Blockchain Data Platform</div>
                </div>
                
                {/* Central content area - improved text flow */}
                <div className="flex-1 px-3 py-2 overflow-y-auto max-h-[150px] flex items-center justify-center">
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
                      <div className="font-mono text-xs text-green-300 bg-black/30 p-2 rounded border-0/30">
                        <pre className="whitespace-pre-wrap text-left text-xs">
                          {JSON.stringify(content, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supported Chains Display */}
                {supportedChains.length > 0 && (
                  <div className="mt-1 mb-1">
                    <div className="text-xs text-green-300 font-semibold mb-1">Supported Chains:</div>
                    <div className="flex flex-wrap gap-1 justify-center max-h-12 overflow-y-auto">
                      {supportedChains.slice(0, 6).map((chain, index) => (
                        <span 
                          key={index}
                          className="bg-green-500/20 text-green-200 px-1.5 py-0.5 rounded-full text-xs border-0/30"
                        >
                          {chain.name || chain.chain_id || 'Chain'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chain Data Display */}
                {chainData && (
                  <div className="mt-1 mb-1">
                    <div className="text-xs text-green-300 font-semibold mb-1">Latest Blocks:</div>
                    <div className="text-white/80 text-xs">
                      {chainData.data && chainData.data.length > 0 ? 
                        `Block #${chainData.data[0].number || 'N/A'}` : 
                        'No data available'
                      }
                    </div>
                  </div>
                )}

                {/* Chainbase Data - SMALL */}
                {apyData && Object.values(apyData).length > 0 && (
                  <div className="px-2">
                    <div className="text-xs text-green-300 font-bold mb-1">
                      {Object.values(apyData)[0].name}
                    </div>
                    
                    {/* Latest block - COMPACT */}
                    {Object.values(apyData)[0].blockData && (
                      <div className="bg-green-500/20 rounded p-1 mb-1">
                        <span className="text-xs text-green-200">Block: </span>
                        <span className="text-xs text-green-300 font-bold">
                          #{Object.values(apyData)[0].blockData.number || Object.values(apyData)[0].blockData}
                        </span>
                      </div>
                    )}
                    
                    {/* Tokens - TINY */}
                    {Object.values(apyData)[0].tokens && (
                      <div className="text-xs">
                        <span className="text-green-200">Tokens: </span>
                        <span className="text-white/70">
                          {Object.values(apyData)[0].tokens.map(t => t.name).join(', ')}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-xs text-green-400/60 mt-1 text-center">
                      Chainbase Live
                    </div>
                  </div>
                )}

                {/* Chain Selector */}
                <div className="mt-1 mb-1">
                  <div className="text-xs text-green-300 font-semibold mb-1">Select Chain:</div>
                  <select 
                    value={selectedChain} 
                    onChange={(e) => setSelectedChain(e.target.value)}
                    className="bg-black/50 text-white text-xs border-0/30 rounded px-1 py-0.5 w-full"
                  >
                    <option value="1">Ethereum</option>
                    <option value="ton">TON</option>
                    <option value="sui">Sui</option>
                    <option value="56">BSC</option>
                    <option value="137">Polygon</option>
                    <option value="43114">Avalanche</option>
                    <option value="250">Fantom</option>
                    <option value="42161">Arbitrum</option>
                    <option value="10">Optimism</option>
                    <option value="8453">Base</option>
                  </select>
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

FloatingChainbaseBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
  originalQuery: PropTypes.string,
  transactionData: PropTypes.object,
  detectedChain: PropTypes.string,
};

export default FloatingChainbaseBubble;
