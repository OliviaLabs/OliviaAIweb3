import React, { useState, useEffect, useRef, useCallback } from 'react';
import useFloatToTop from '../../hooks/useFloatToTop';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import walletConnectLogo from '../../assets/wallet-connect.png';

const FloatingPortfolioBubble = ({ 
  isOpen, 
  onClose, 
  title = "WalletConnect", 
  content = "", 
  loading = false,
  addParticlesToSwarm 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [hasInitialized, setHasInitialized] = useState(false);
  const bubbleRef = useRef(null);
  const bubbleId = useRef(`portfolio-${Date.now()}`).current;
  
  // Wallet connection
  const { address, isConnected, chain } = useAccount();
  
  // Get native token balance (ETH, MATIC, etc.)
  const { data: nativeBalance, isLoading: balanceLoading } = useBalance({
    address: address,
    enabled: isConnected && isExpanded, // Only fetch when expanded
  });
  
  // Format portfolio data
  const [portfolioData, setPortfolioData] = useState(null);
  const [tokenBalances, setTokenBalances] = useState([]);
  const fetchedOnceRef = useRef({ address: null, at: 0 });
  

  
  // Update global context for AI
  const updateAIContext = useCallback((data) => {
    if (window.contextAwarenessData) {
      window.contextAwarenessData = {
        ...window.contextAwarenessData,
        portfolio_data: {
          wallet: {
            data: data,
            timestamp: new Date().toISOString()
          }
        }
      };
    }
  }, []);
  
  // Track if we're already fetching to prevent duplicate calls
  const [isFetchingTokens, setIsFetchingTokens] = useState(false);
  const [pepePrice, setPepePrice] = useState(null);
  
  // Fetch PEPE price from CoinGecko
  const fetchPepePrice = useCallback(async () => {
    try {
      // Use centralized CoinGecko service
      const { coingeckoService } = await import('../../api');
      const data = await coingeckoService.getPrices(['pepe']);
      setPepePrice(data.pepe?.usd);
    } catch (error) {
      console.error('Error fetching PEPE price:', error);
    }
  }, []);
  
  // Fetch token balances from Alchemy via microservice
  const fetchTokenBalances = useCallback(async () => {
    if (!address || isFetchingTokens || tokenBalances.length > 0) return;
    
    setIsFetchingTokens(true);
    
    try {
      // Call Alchemy directly to avoid microservice rate limits
      const network = chain?.id === 1 ? 'eth-mainnet' : 
                      chain?.id === 137 ? 'polygon-mainnet' : 
                      chain?.id === 42161 ? 'arb-mainnet' : 
                      chain?.id === 10 ? 'opt-mainnet' : 
                      'eth-mainnet';
      
      const alchemyApiKey = '_pGB49JjZobNT7IahUuqg'; // Your API key that works
      
      // Get token balances directly from Alchemy
      const response = await fetch(
        `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'alchemy_getTokenBalances',
            params: [address]
          })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Alchemy response:', data);
        if (data.result?.tokenBalances) {
          console.log(`📊 Found ${data.result.tokenBalances.length} tokens from Alchemy`);
          
          // Filter out zero balances
          const nonZeroTokens = data.result.tokenBalances.filter(
            token => token.tokenBalance !== '0x0' && 
                    token.tokenBalance !== '0x00' && 
                    token.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
          );
          
          console.log(`📊 Found ${nonZeroTokens.length} tokens with balance`);
          
          // Fetch metadata for each token
          const tokenPromises = nonZeroTokens.slice(0, 10).map(async (token) => {
            try {
              const metadataResponse = await fetch(
                `https://${network}.g.alchemy.com/v2/${alchemyApiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'alchemy_getTokenMetadata',
                    params: [token.contractAddress]
                  })
                }
              );
              
              if (metadataResponse.ok) {
                const metadataData = await metadataResponse.json();
                const metadata = metadataData.result;
                const balance = parseInt(token.tokenBalance, 16);
                const decimals = metadata?.decimals || 18;
                const formattedBalance = (balance / Math.pow(10, decimals)).toFixed(6);
                
                return {
                  symbol: metadata?.symbol || 'Unknown',
                  name: metadata?.name || 'Unknown Token',
                  balance: formattedBalance,
                  decimals: decimals,
                  contractAddress: token.contractAddress,
                  logo: metadata?.logo
                };
              }
            } catch (err) {
              console.error('Error fetching token metadata:', err);
            }
            return null;
          });
          
          const formattedTokens = (await Promise.all(tokenPromises)).filter(t => t !== null);
          console.log(`📊 Showing ${formattedTokens.length} tokens:`, formattedTokens.map(t => `${t.symbol}: ${t.balance}`));
          console.log(`📊 All token details:`, formattedTokens);
          setTokenBalances(formattedTokens);
          
          // Fetch PEPE price if we have tokens
          if (formattedTokens.length > 0) {
            fetchPepePrice();
            
            // Update AI context with portfolio data
            const portfolioContext = {
              connected: true,
              address: address,
              chain: chain?.name || 'Unknown',
              tokens: formattedTokens.map(t => ({
                symbol: t.symbol,
                name: t.name,
                balance: t.balance,
                contractAddress: t.contractAddress
              })),
              summary: `Wallet contains: ${formattedTokens.map(t => `${t.balance} ${t.symbol}`).join(', ')}`
            };
            
            updateAIContext(portfolioContext);
            console.log('🧠 Updated AI context with portfolio data:', portfolioContext);
            console.log('🧠 Window context data:', window.contextAwarenessData);
          }
        }
      } else {
        console.error('❌ Failed to fetch tokens:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching token balances:', error);
    } finally {
      setIsFetchingTokens(false);
    }
    }, [address, chain, isExpanded, isFetchingTokens, tokenBalances.length]);
  
  // Fetch tokens automatically when wallet connects
  useEffect(() => {
    if (!isConnected || !address) return;
    const now = Date.now();
    const lastAddr = fetchedOnceRef.current.address;
    const lastAt = fetchedOnceRef.current.at;
    const isNewAddress = lastAddr !== address;
    const isStale = now - lastAt > 60000; // 60s throttle
    if ((isNewAddress || isStale) && !isFetchingTokens) {
      fetchedOnceRef.current = { address, at: now };
      console.log('🚀 Auto-fetching tokens for connected wallet (throttled)');
      fetchTokenBalances();
    }
  }, [isConnected, address, isFetchingTokens]);
  
  useEffect(() => {
    if (nativeBalance && !balanceLoading) {
      // Format the balance data
      const formatted = {
        native: {
          symbol: nativeBalance.symbol,
          balance: formatUnits(nativeBalance.value, nativeBalance.decimals),
          decimals: nativeBalance.decimals,
          formatted: nativeBalance.formatted
        },
        chain: chain?.name || 'Unknown',
        address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected',
        fullAddress: address
      };
      setPortfolioData(formatted);
      
      // Avoid hammering: only fetch if we have no tokens and haven't fetched recently
      const now = Date.now();
      const lastAt = fetchedOnceRef.current.at;
      if (!tokenBalances.length && now - lastAt > 60000 && !isFetchingTokens) {
        fetchedOnceRef.current = { address, at: now };
        fetchTokenBalances();
      }
      
      // Update AI context with wallet data
      if (isExpanded && isConnected) {
        const allTokens = [
          `${formatted.native.formatted} ${formatted.native.symbol}`,
          ...tokenBalances.map(t => `${t.balance} ${t.symbol}`)
        ];
        
        updateAIContext({
          connected: true,
          address: formatted.address,
          fullAddress: address,
          chain: formatted.chain,
          balance: `${formatted.native.formatted} ${formatted.native.symbol}`,
          nativeToken: formatted.native.symbol,
          nativeBalance: formatted.native.formatted,
          tokens: tokenBalances,
          allBalances: allTokens.join(', ')
        });
      }
    }
  }, [nativeBalance, balanceLoading, address, chain, isExpanded, isConnected, updateAIContext, tokenBalances]);

  // Initialize position
  useEffect(() => {
    if (!hasInitialized && isOpen) {
      const initialX = 100 + Math.random() * 100;
      const initialY = 100 + Math.random() * 100;
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
            color: '#a855f7' // Purple color for portfolio
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

  // Responsive bubble sizes: half-size on mobile, full-size on desktop
  const isMobile = window.innerWidth < 768;
  const collapsedSize = isMobile ? 70 : 140;
  const maxExpandedSize = isMobile ? 150 : 300;
  
  // Bubble ALWAYS stays circular - never bigger than screen
  const maxSize = Math.min(maxExpandedSize, window.innerWidth - 40, window.innerHeight - 100);
  const bubbleSize = isExpanded ? maxSize : collapsedSize;
  
  const bubbleWidth = bubbleSize;
  const bubbleHeight = bubbleSize;
  
  // Floating animation state
  const [floatOffset, setFloatOffset] = useState(0);
  const containerRef = useRef(null);
  
  // Floating swarm effect like other bubbles
  // Remove auto-floating (replaced by universal float hook)
  useEffect(() => { return undefined; }, [isOpen, isDragging, isExpanded, bubbleId]);
  useFloatToTop({ isOpen, isDragging, isExpanded, position, setPosition, topBarrier: 20, speed: 0.6 });
  
  const bubble = (
    <div 
      ref={containerRef}
      className={`fixed pointer-events-auto select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isDragging ? '' : 'transition-all duration-150 ease-in-out'}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${bubbleWidth}px`,
        height: `${bubbleHeight}px`,
        zIndex: 2147483647,
        willChange: isDragging ? 'transform' : 'auto',
        transition: isDragging ? 'none' : 'top 0.1s ease-out'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="portfolio"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-0 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #a855f7, inset 0 0 20px rgba(168, 85, 247, 0.15)'}}>
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-full border-0/60 animate-pulse" style={{boxShadow: '0 0 25px #a855f7, 0 0 50px rgba(168, 85, 247, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-500/5 via-transparent to-purple-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>
        
        {/* Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading || balanceLoading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <Wallet className="w-10 h-10 text-purple-400 mb-2" />
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs font-semibold text-purple-400">Loading Portfolio...</div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center relative">
              {!isExpanded ? (
                // Collapsed: Unified 80px circular icon
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-0 shadow-none bg-transparent">
                    <img src={walletConnectLogo} alt="WalletConnect" className="w-full h-full object-cover" draggable={false} />
                  </div>
                </div>
              ) : (
                // Expanded: Centered content with consistent padding
                <div className="w-full h-full flex flex-col justify-center items-center px-4 pt-6 pb-4">
                  <div className="text-center mb-1">
                    <div className="w-6 h-6 rounded-full overflow-hidden border-0 shadow-none bg-transparent bg-transparent">
                      <img src={walletConnectLogo} alt="WalletConnect" className="w-full h-full object-cover" draggable={false} />
                    </div>
                    <div className="text-[8px] font-bold text-purple-300">Portfolio</div>
                  </div>
                  
                  <div className="flex-1 px-2 overflow-y-auto flex items-center justify-center">
                    <div className="text-center space-y-1">
                      {!isConnected ? (
                        <div className="text-[7px] text-white/90 leading-tight">
                          <p className="text-purple-300">No Wallet</p>
                        </div>
                      ) : portfolioData ? (
                        <div className="text-[7px] text-white/90 leading-tight space-y-1">
                          <div className="text-[6px] text-purple-300">
                            {portfolioData.address}
                          </div>
                          
                          <div className="text-[7px] text-white">
                            {tokenBalances.length > 0 ? (
                              <div>
                                <span className="text-gray-400">{tokenBalances[0].symbol}:</span> {tokenBalances[0].balance}
                                {pepePrice ? (
                                  <div className="text-xs text-green-400 mt-1">
                                    ≈ ${(parseFloat(tokenBalances[0].balance) * pepePrice).toFixed(2)} USD
                                  </div>
                                ) : (
                                  <div className="text-xs text-yellow-400 mt-1">Loading price...</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500">Loading...</div>
                            )}
                          </div>
                          
                          {/* Debug info */}
                          <div className="mt-2 text-xs text-gray-600">
                            Price: ${pepePrice || 'loading'} | Tokens: {tokenBalances.length}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-white/90 leading-relaxed">
                          <p className="text-purple-300">Loading balance...</p>
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

FloatingPortfolioBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.any,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
};

export default FloatingPortfolioBubble;
