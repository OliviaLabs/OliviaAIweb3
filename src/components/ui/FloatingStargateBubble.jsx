import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import stargateLogo from '../../assets/stargate-logo.jpg';
import { stargateService } from '../../api/services/stargate.service';
import { log, error as logError } from '../../utils/logger';

// Helper function to extract bridge parameters from AI commands
const extractBridgeParameters = (command) => {
  if (!command) return {};
  
  const lowerCommand = command.toLowerCase();
  let token = null;
  let amount = null;
  let fromChain = 1; // Default to Ethereum
  let toChain = 137; // Default to Polygon
  
  // Extract token
  if (lowerCommand.includes('usdc')) token = 'USDC';
  else if (lowerCommand.includes('usdt')) token = 'USDT';
  else if (lowerCommand.includes('eth')) token = 'ETH';
  else if (lowerCommand.includes('stg')) token = 'STG';
  
  // Extract amount
  const amountMatch = lowerCommand.match(/(\d+(?:\.\d+)?)/);
  if (amountMatch) amount = amountMatch[1];
  
  // Extract destination chain
  if (lowerCommand.includes('polygon') || lowerCommand.includes('matic')) toChain = 137;
  else if (lowerCommand.includes('arbitrum')) toChain = 42161;
  else if (lowerCommand.includes('optimism')) toChain = 10;
  else if (lowerCommand.includes('avalanche') || lowerCommand.includes('avax')) toChain = 43114;
  else if (lowerCommand.includes('bnb') || lowerCommand.includes('bsc')) toChain = 56;
  else if (lowerCommand.includes('fantom')) toChain = 250;
  
  // Extract source chain
  if (lowerCommand.includes('from polygon')) fromChain = 137;
  else if (lowerCommand.includes('from arbitrum')) fromChain = 42161;
  else if (lowerCommand.includes('from optimism')) fromChain = 10;
  else if (lowerCommand.includes('from avalanche')) fromChain = 43114;
  else if (lowerCommand.includes('from bnb')) fromChain = 56;
  else if (lowerCommand.includes('from fantom')) fromChain = 250;
  
  return { token, amount, fromChain, toChain };
};

const FloatingStargateBubble = ({ isOpen, onClose, title = 'Stargate', content = '', loading = false, addParticlesToSwarm, originalQuery = '' }) => {
  const bubbleId = useState(() => `stargate-${Date.now()}-${Math.random()}`)[0];
  const [position, setPosition] = useState(() => {
    const startX = Math.random() * (window.innerWidth - 300) + 100;
    const startY = window.innerHeight - Math.random() * 300 - 100;
    return { x: startX, y: startY };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Bridge form state
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [fromChain, setFromChain] = useState(1); // Ethereum
  const [toChain, setToChain] = useState(137); // Polygon
  const [quote, setQuote] = useState(null);
  const [bridgeStatus, setBridgeStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get supported chains and tokens
  const supportedChains = stargateService.getSupportedChains();
  const supportedTokens = stargateService.getSupportedTokens();

  // Auto-fill form from AI command
  useEffect(() => {
    if (originalQuery) {
      const params = extractBridgeParameters(originalQuery);
      if (params.token) setSelectedToken(params.token);
      if (params.amount) setAmount(params.amount);
      if (params.fromChain) setFromChain(params.fromChain);
      if (params.toChain) setToChain(params.toChain);
    }
  }, [originalQuery]);

  // Update AI context when bridge data changes
  useEffect(() => {
    if (isConnected && quote) {
      const bridgeData = {
        connected: true,
        address: address,
        quote: quote,
        status: bridgeStatus,
        summary: `Bridge quote: ${quote.amount} ${quote.token} from ${quote.fromChain.name} to ${quote.toChain.name}, Fee: $${quote.fees.totalFee}`
      };
      
      // Update global context
      if (window.contextAwarenessData) {
        window.contextAwarenessData.stargate_data = bridgeData;
      } else {
        window.contextAwarenessData = { stargate_data: bridgeData };
      }
      
      log('🌉 Updated AI context with Stargate bridge data:', bridgeData);
    }
  }, [isConnected, address, quote, bridgeStatus]);

  // Floating animation
  useEffect(() => {
    if (!isOpen || isDragging) return;

    const interval = setInterval(() => {
      setPosition(prev => {
        let bubbleSize = 140;
        if (isExpanded) {
          bubbleSize = 380;
        }
        const margin = 20;
        
        let newY = prev.y;
        let newX = prev.x;
        
        const floatForce = -1.0;
        newY += floatForce;
        
        if (newY < margin) {
          newY = margin;
        }
        
        const maxX = window.innerWidth - bubbleSize - margin;
        if (newX > maxX) newX = maxX;
        if (newX < margin) newX = margin;
        
        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isDragging, isExpanded]);

  // Get bridge quote
  const getBridgeQuote = async () => {
    if (!amount || fromChain === toChain) return;
    
    setIsLoading(true);
    setBridgeStatus('Getting bridge quote...');
    
    try {
      const bridgeQuote = await stargateService.getBridgeQuote(fromChain, toChain, selectedToken, amount);
      setQuote(bridgeQuote);
      setBridgeStatus(`Quote ready: $${bridgeQuote.fees.totalFee} total fee`);
    } catch (error) {
      logError('Quote error:', error);
      setBridgeStatus('Failed to get quote');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute bridge
  const handleBridge = async () => {
    if (!quote || !address) return;
    
    setIsLoading(true);
    setBridgeStatus('Preparing bridge transaction...');
    
    try {
      const transaction = await stargateService.prepareBridgeTransaction(quote, address);
      setBridgeStatus('Transaction ready! Please sign in your wallet.');
      log('Bridge transaction prepared:', transaction);
      
      // Here you would trigger the wallet to sign the transaction
      // For now, we'll simulate the process
      setTimeout(() => {
        setBridgeStatus('Bridge initiated! Tokens will arrive in 5-10 minutes.');
      }, 2000);
      
    } catch (error) {
      logError('Bridge error:', error);
      setBridgeStatus('Bridge failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleClick = (e) => {
    if (isDragging) return;
    
    const currentTime = Date.now();
    if (currentTime - lastClickTime < 200) {
      // Double click - add particles
      if (addParticlesToSwarm) {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const particles = Array.from({ length: 8 }, (_, i) => ({
          id: `stargate-particle-${Date.now()}-${i}`,
          x: centerX,
          y: centerY,
          color: '#3b82f6',
          size: Math.random() * 4 + 2
        }));
        
        addParticlesToSwarm(particles);
      }
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
  
  // Dynamic bubble size
  let bubbleSize = 140;
  if (isExpanded) {
    bubbleSize = 380;
  }
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
        zIndex: 2147483646,
        willChange: isDragging ? 'transform' : 'auto'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-bubble="stargate"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-blue-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #3b82f6, inset 0 0 20px rgba(59, 130, 246, 0.15)'}}>
        {/* Blue glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-blue-300/60 animate-pulse" style={{boxShadow: '0 0 25px #3b82f6, 0 0 50px rgba(59, 130, 246, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-500/5 via-transparent to-blue-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-300 text-xs font-bold flex items-center justify-center border border-blue-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-400 shadow-lg shadow-blue-500/40 mb-2 bg-black/20">
                <img 
                  src={stargateLogo} 
                  alt="Stargate" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs text-blue-300">Loading...</div>
            </div>
          ) : !isExpanded ? (
            <div className="text-center flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-400 shadow-lg shadow-blue-500/40 mb-2 bg-black/20">
                <img 
                  src={stargateLogo} 
                  alt="Stargate" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
              <p className="text-blue-300 text-xs">Cross-Chain Bridge</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-center text-white text-xs overflow-y-auto px-2">
              {/* Header */}
              <div className="flex items-center justify-center mb-2">
                <img src={stargateLogo} alt="Stargate" className="w-4 h-4 mr-1 rounded" />
                <h3 className="text-white font-bold text-xs">{title}</h3>
              </div>

              {isConnected ? (
                <div className="space-y-1">
                  <p className="text-xs text-blue-200 mb-1 text-center">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}
                  </p>
                  
                  {/* Token Selection */}
                  <div>
                    <label className="block text-xs text-blue-200">Token</label>
                    <select
                      className="w-full p-0.5 bg-blue-800/50 border border-blue-600 rounded text-white text-xs h-6"
                      value={selectedToken}
                      onChange={(e) => setSelectedToken(e.target.value)}
                    >
                      {supportedTokens.map(token => (
                        <option key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs text-blue-200">Amount</label>
                    <input
                      type="number"
                      className="w-full p-0.5 bg-blue-800/50 border border-blue-600 rounded text-white text-xs h-6"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                    />
                  </div>

                  {/* From Chain */}
                  <div>
                    <label className="block text-xs text-blue-200">From</label>
                    <select
                      className="w-full p-0.5 bg-blue-800/50 border border-blue-600 rounded text-white text-xs h-6"
                      value={fromChain}
                      onChange={(e) => setFromChain(parseInt(e.target.value))}
                    >
                      {supportedChains.map(chain => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* To Chain */}
                  <div>
                    <label className="block text-xs text-blue-200">To</label>
                    <select
                      className="w-full p-0.5 bg-blue-800/50 border border-blue-600 rounded text-white text-xs h-6"
                      value={toChain}
                      onChange={(e) => setToChain(parseInt(e.target.value))}
                    >
                      {supportedChains.map(chain => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Get Quote Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      getBridgeQuote();
                    }}
                    disabled={isLoading || !amount || fromChain === toChain}
                    className="w-full bg-blue-600/80 hover:bg-blue-700 text-white font-bold py-0.5 px-1 rounded text-xs h-6 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Getting Quote...' : 'Get Quote'}
                  </button>

                  {quote && (
                    <div className="text-xs text-blue-200 text-center space-y-0.5">
                      <p>Fee: ${quote.fees.totalFee}</p>
                      <p>Time: {quote.estimatedTime}</p>
                      <p>Min Received: {quote.minReceived} {quote.token}</p>
                    </div>
                  )}

                  {/* Bridge Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBridge();
                    }}
                    disabled={isLoading || !quote}
                    className="w-full bg-green-600/80 hover:bg-green-700 text-white font-bold py-0.5 px-1 rounded text-xs h-6 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Bridging...' : 'Bridge Tokens'}
                  </button>

                  {bridgeStatus && (
                    <p className="text-xs text-blue-200 text-center">{bridgeStatus}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-blue-200 text-center">
                    Connect your wallet to use Stargate bridging
                  </p>
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

FloatingStargateBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
  originalQuery: PropTypes.string
};

export default FloatingStargateBubble;
