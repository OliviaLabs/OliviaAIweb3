import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Coins, Database, Loader } from 'lucide-react';
import { useAccount } from 'wagmi';
import alchemyLogo from '../../assets/alchemy-logo.png';

const FloatingAlchemyBubble = ({ 
  isOpen, 
  onClose, 
  title = "Alchemy", 
  content = "", 
  loading = false,
  addParticlesToSwarm 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 150, y: 150 });
  const [hasInitialized, setHasInitialized] = useState(false);
  const [tokenBalances, setTokenBalances] = useState(null);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const bubbleRef = useRef(null);
  const bubbleId = useRef(`alchemy-${Date.now()}`).current;
  const fetchInProgressRef = useRef(false);
  
  // Wallet connection
  const { address, isConnected, chain } = useAccount();
  
  // Fetch token balances from Portfolio API (multi-chain)
  const fetchTokenBalances = useCallback(async () => {
    if (!address || !isConnected) return;
    
    // Helper function to get raw balance value
    const getRawBalance = (balance, decimals = 18) => {
      if (!balance || balance === '0' || balance === '0x0') return 0;
      
      let value;
      if (typeof balance === 'string' && balance.startsWith('0x')) {
        value = parseInt(balance, 16) / Math.pow(10, decimals);
      } else if (typeof balance === 'string' && balance.includes('.')) {
        value = parseFloat(balance);
      } else {
        value = parseFloat(balance) / Math.pow(10, decimals);
      }
      
      return value;
    };
    
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      console.log('Portfolio fetch already in progress, skipping...');
      return;
    }
    
    fetchInProgressRef.current = true;
    setIsLoadingTokens(true);
    try {
      // Call the portfolio API for multi-chain data
      const response = await fetch(`${import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'http://localhost:3001'}/api/portfolio/${address}`);
      
      // Check if the response is OK before parsing
      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Rate limit exceeded for portfolio API. Please try again later.');
          // Don't retry immediately to avoid more rate limit issues
          return;
        }
        throw new Error(`Portfolio API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        console.log('🔮 Alchemy Portfolio response:', data);
        
        // Fetch prices for tokens with significant balances
        const tokensWithBalance = data.data.filter(token => {
          const balance = getRawBalance(token.balance, token.decimals || 18);
          return balance > 0.0001; // Filter out dust
        });
        
        // Try to fetch prices from CoinGecko for known tokens
        const enrichedTokens = await Promise.all(tokensWithBalance.map(async (token) => {
          try {
            // Static prices for stablecoins
            const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'USDP'];
            if (stablecoins.includes(token.symbol?.toUpperCase())) {
              const balance = getRawBalance(token.balance, token.decimals || 18);
              return { ...token, priceUSD: 1.00, valueUSD: balance };
            }
            
            // Try to fetch real prices from CoinGecko
            const symbolToId = {
              'ETH': 'ethereum',
              'WETH': 'ethereum',
              'BTC': 'bitcoin',
              'WBTC': 'wrapped-bitcoin',
              'LINK': 'chainlink',
              'UNI': 'uniswap',
              'MATIC': 'matic-network',
              'SHIB': 'shiba-inu',
              'PEPE': 'pepe',
              'ARB': 'arbitrum',
              'OP': 'optimism'
            };
            
            const coinId = symbolToId[token.symbol?.toUpperCase()];
            if (coinId) {
              try {
                // Use centralized CoinGecko service
                const { coingeckoService } = await import('../../api');
                const priceData = await coingeckoService.getPrices([coinId]);
                const price = priceData[coinId]?.usd || 0;
                const balance = getRawBalance(token.balance, token.decimals || 18);
                const valueUSD = balance * price;
                return { ...token, priceUSD: price, valueUSD: valueUSD };
              } catch (e) {
                console.warn(`Could not fetch price for ${token.symbol}:`, e);
              }
            }
            
            // For unknown tokens, return without USD value
            return token;
          } catch (err) {
            console.warn(`Error processing token ${token.symbol}:`, err);
            return token;
          }
        }));
        
        // Transform portfolio data to match expected format
        const portfolioData = {
          address: address,
          chainId: chain?.id || 1,
          balances: enrichedTokens,
          totalTokens: enrichedTokens.length
        };
        
        setTokenBalances(portfolioData);
        
        // Update AI context with portfolio data
        updateAIContext(portfolioData);
      } else {
        console.warn('Portfolio API returned unsuccessful response:', data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      // Set empty token balances to prevent infinite retries
      setTokenBalances({
        address: address,
        chainId: chain?.id || 1,
        balances: [],
        totalTokens: 0,
        error: true
      });
    } finally {
      setIsLoadingTokens(false);
      fetchInProgressRef.current = false;
    }
  }, [address, isConnected, chain?.id]);
  
  // Update global context for AI
  const updateAIContext = useCallback((data) => {
    // Create the portfolio context with raw data (AI will understand)
    const portfolioContext = {
      portfolio_data: {
        wallet_address: data.address,
        total_tokens: data.totalTokens,
        tokens: data.balances?.map(token => ({
          symbol: token.symbol,
          name: token.name,
          balance: token.balance,
          decimals: token.decimals,
          price_usd: token.priceUSD || null,
          value_usd: token.valueUSD || null,
          chain: token.chain || 'ethereum',
          contract_address: token.contractAddress
        })) || [],
        timestamp: new Date().toISOString(),
        source: 'Alchemy API',
        has_wallet_connected: true
      }
    };
    
    // Update window context for AI
    if (window.contextAwarenessData) {
      window.contextAwarenessData = {
        ...window.contextAwarenessData,
        ...portfolioContext
      };
    } else {
      window.contextAwarenessData = portfolioContext;
    }
    
    console.log('🧠 Updated AI context with portfolio data:', portfolioContext);
    console.log('🧠 Full context available to AI:', window.contextAwarenessData);
  }, []);
  
  // Fetch tokens immediately when bubble opens (don't wait for expansion)
  useEffect(() => {
    if (isOpen && isConnected && !tokenBalances && !isLoadingTokens) {
      console.log('🚀 Fetching portfolio data immediately on bubble open');
      fetchTokenBalances();
    }
  }, [isOpen, isConnected, tokenBalances, isLoadingTokens, fetchTokenBalances]);

  // Initialize position
  useEffect(() => {
    if (!hasInitialized && isOpen) {
      const initialX = 150 + Math.random() * 100;
      const initialY = 150 + Math.random() * 100;
      setPosition({ x: initialX, y: initialY });
      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        const maxX = window.innerWidth - (isExpanded ? 350 : 140);
        const maxY = window.innerHeight - (isExpanded ? 350 : 140);
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, isExpanded]);

  const handleClick = (e) => {
    if (e.target.closest('button')) return;
    if (!isDragging) {
      setIsExpanded(!isExpanded);
      if (addParticlesToSwarm && !isExpanded) {
        // Create particle effect on expansion
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create array of particles for the effect
        const particles = [];
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const velocity = 2 + Math.random() * 3;
          particles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            size: 2 + Math.random() * 3,
            color: '#4169E1' // Blue color for Alchemy
          });
        }
        addParticlesToSwarm(particles);
      }
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isExpanded]);

  if (!isOpen) return null;

  const bubbleSize = 140;
  const bubbleWidth = isExpanded ? Math.min(500, window.innerWidth - 40) : bubbleSize;
  const bubbleHeight = isExpanded ? Math.min(400, window.innerHeight - 100) : bubbleSize;
  
  // Get raw numeric balance value
  const getRawBalance = (balance, decimals = 18) => {
    if (!balance || balance === '0' || balance === '0x0') return 0;
    
    // Handle different balance formats
    let value;
    if (typeof balance === 'string' && balance.startsWith('0x')) {
      // Hex format
      value = parseInt(balance, 16) / Math.pow(10, decimals);
    } else if (typeof balance === 'string' && balance.includes('.')) {
      // Already decimal
      value = parseFloat(balance);
    } else {
      // Raw number
      value = parseFloat(balance) / Math.pow(10, decimals);
    }
    
    return value;
  };
  
  // Format token display properly
  const formatTokenBalance = (balance, decimals = 18) => {
    const value = getRawBalance(balance, decimals);
    if (value === 0) return '0';
    if (value < 0.0001) return '<0.0001';
    if (value < 1) return value.toFixed(4);
    if (value < 1000) return value.toFixed(2);
    if (value < 1000000) return `${(value/1000).toFixed(1)}K`;
    return `${(value/1000000).toFixed(1)}M`;
  };
  
  // Format USD value
  const formatUSDValue = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (num < 0.01) return '<$0.01';
    if (num < 1) return `$${num.toFixed(2)}`;
    if (num < 1000) return `$${num.toFixed(0)}`;
    if (num < 1000000) return `$${(num/1000).toFixed(1)}K`;
    return `$${(num/1000000).toFixed(1)}M`;
  };
  
  const bubble = (
    <div 
      ref={bubbleRef}
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-150 ease-in-out'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleWidth}px`,
        height: `${bubbleHeight}px`,
        zIndex: 2147483647,
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="alchemy"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #4169E1, inset 0 0 20px rgba(65, 105, 225, 0.15)'}}>
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: '0 0 25px #4169E1, 0 0 50px rgba(65, 105, 225, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-500/5 via-transparent to-blue-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>
        
        {/* Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading || isLoadingTokens ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <Database className="w-30 h-30 text-blue-400 mb-2" />
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-blue-400">Fetching Tokens...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Unified 80px circular icon
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-0 shadow-none bg-transparent">
                    <img 
                      src={alchemyLogo} 
                      alt="Alchemy" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                // Expanded: Simple token list
                <div className="w-full h-full flex flex-col p-4">
                  {/* Simple header */}
                  <div className="text-center mb-3">
                    <div className="text-sm font-bold text-blue-300">Wallet Portfolio</div>
                    {address && (
                      <div className="text-xs text-white/60 mt-1">
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </div>
                    )}
                  </div>
                  
                  {/* Token list - no scrolling, just simple list */}
                  <div className="flex-1 flex flex-col justify-center">
                    {!isConnected ? (
                      <div className="text-center">
                        <p className="text-sm text-white/70">Connect wallet to view tokens</p>
                      </div>
                    ) : tokenBalances && tokenBalances.balances && tokenBalances.balances.length > 0 ? (
                      <div className="space-y-0.5 max-h-[250px] overflow-y-auto">
                        {/* Header row */}
                        <div className="text-xs text-blue-300/70 pb-1 border-b border-blue-400/20">
                          <div className="grid grid-cols-3 gap-1">
                            <span>Token</span>
                            <span className="text-right">Amount</span>
                            <span className="text-right">Value</span>
                          </div>
                        </div>
                        {/* Token rows - show ALL tokens */}
                        {tokenBalances.balances.map((token, index) => (
                          <div key={index} className="text-xs text-white/90 py-0.5 hover:bg-white/5 rounded">
                            <div className="grid grid-cols-3 gap-1 items-center">
                              <span className="text-white/70 truncate">{token.symbol || 'Token'}</span>
                              <span className="text-white font-medium text-right">
                                {formatTokenBalance(token.balance, token.decimals || 18)}
                              </span>
                              <span className="text-green-400 font-medium text-right">
                                {formatUSDValue(token.valueUSD) || '$0'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : tokenBalances ? (
                      <div className="text-center">
                        <p className="text-xs text-white/50">No tokens found</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs text-white/50">Loading tokens...</p>
                      </div>
                    )}
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

FloatingAlchemyBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingAlchemyBubble;
