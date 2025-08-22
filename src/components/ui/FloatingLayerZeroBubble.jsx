import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import layerZeroLogo from '../../assets/layerzero-logo.png';
import { realLayerZeroService } from '../../api/services/layerzero-real.service';
import { log, error as logError } from '../../utils/logger';

// Helper function to extract bridge parameters from AI commands
const extractBridgeParameters = (command) => {
  if (!command) return {};
  
  const lowerCommand = command.toLowerCase();
  let token = null;
  let amount = null;
  let fromChain = 'ethereum';
  let toChain = 'arbitrum';
  
  // Extract token
  if (lowerCommand.includes('usdc')) token = 'USDC';
  else if (lowerCommand.includes('usdt')) token = 'USDT';
  else if (lowerCommand.includes('eth')) token = 'ETH';
  
  // Extract amount
  const amountMatch = lowerCommand.match(/(\d+(?:\.\d+)?)/);
  if (amountMatch) amount = amountMatch[1];
  
  // Extract destination chain
  if (lowerCommand.includes('to arbitrum') || lowerCommand.includes('arbitrum')) toChain = 'arbitrum';
  else if (lowerCommand.includes('to polygon') || lowerCommand.includes('polygon')) toChain = 'polygon';
  else if (lowerCommand.includes('to optimism') || lowerCommand.includes('optimism')) toChain = 'optimism';
  else if (lowerCommand.includes('to base') || lowerCommand.includes('base')) toChain = 'base';
  
  // Extract source chain
  if (lowerCommand.includes('from polygon')) fromChain = 'polygon';
  else if (lowerCommand.includes('from arbitrum')) fromChain = 'arbitrum';
  else if (lowerCommand.includes('from optimism')) fromChain = 'optimism';
  else if (lowerCommand.includes('from base')) fromChain = 'base';
  
  return { token, amount, fromChain, toChain };
};

const FloatingLayerZeroBubble = ({ isOpen, onClose, title = 'LayerZero', content = '', loading = false, addParticlesToSwarm, originalQuery = '' }) => {
  const bubbleId = useState(() => `layerzero-${Date.now()}-${Math.random()}`)[0];
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
  const [fromChain, setFromChain] = useState('ethereum');
  const [toChain, setToChain] = useState('arbitrum');
  const [feeEstimate, setFeeEstimate] = useState(null);
  const [bridgeStatus, setBridgeStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Supported chains and tokens
  const supportedChains = [
    { id: 'ethereum', name: 'Ethereum' },
    { id: 'arbitrum', name: 'Arbitrum' },
    { id: 'polygon', name: 'Polygon' },
    { id: 'optimism', name: 'Optimism' },
    { id: 'base', name: 'Base' }
  ];

  const supportedTokens = [
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether USD' },
    { symbol: 'ETH', name: 'Ethereum' }
  ];

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

  // Estimate fee function
  const estimateFee = async () => {
    if (!amount || fromChain === toChain) return;
    
    setIsLoading(true);
    setBridgeStatus('Estimating fee...');
    
    try {
      const fee = await realLayerZeroService.estimateBridgeFee(selectedToken, amount, fromChain, toChain);
      setFeeEstimate(fee);
      setBridgeStatus(`Fee estimated: $${fee}`);
    } catch (error) {
      logError('Fee estimation error:', error);
      setBridgeStatus('Fee estimation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Bridge function
  const handleBridge = async () => {
    if (!amount || !feeEstimate || fromChain === toChain) return;
    
    setIsLoading(true);
    setBridgeStatus('Preparing bridge transaction...');
    
    try {
      const txData = await realLayerZeroService.prepareBridge(selectedToken, amount, fromChain, toChain, address);
      setBridgeStatus(`Bridge prepared! Transaction ready for signing.`);
      log('Bridge transaction prepared:', txData);
    } catch (error) {
      logError('Bridge preparation error:', error);
      setBridgeStatus('Bridge preparation failed');
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
          id: `layerzero-particle-${Date.now()}-${i}`,
          x: centerX,
          y: centerY,
          color: '#8b5cf6',
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
      data-bubble="layerzero"
      data-bubble-id={bubbleId}
    >
      <div className="w-full h-full bg-gradient-to-br from-black/80 via-black/90 to-black/95 border-2 border-purple-400 rounded-full shadow-2xl flex flex-col overflow-hidden relative backdrop-blur-sm" style={{boxShadow: '0 0 30px #a855f7, inset 0 0 20px rgba(168, 85, 247, 0.15)'}}>
        {/* Purple glowing border effect */}
        <div className="absolute inset-0 rounded-full border border-purple-300/60 animate-pulse" style={{boxShadow: '0 0 25px #a855f7, 0 0 50px rgba(168, 85, 247, 0.3)'}}></div>
        
        {/* Ambient glow overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-500/5 via-transparent to-purple-400/10 animate-pulse" style={{animationDuration: '3s'}}></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-1 right-1 text-white hover:text-red-400 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500/20 transition-all duration-300 text-xs font-bold flex items-center justify-center border border-purple-400/50 hover:border-red-400/70 z-20 hover:shadow-lg hover:shadow-red-400/30"
          aria-label="Close"
        >
          ×
        </button>
        
        {/* Content Area */}
        <div className="absolute inset-4 flex items-center justify-center">
          {loading ? (
            <div className="text-white font-medium animate-pulse text-center flex flex-col items-center">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400 shadow-lg shadow-purple-500/40 mb-2 bg-black/20">
                <img 
                  src={layerZeroLogo} 
                  alt="LayerZero" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
              <div className="flex items-center gap-1 justify-center mb-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-xs text-purple-300">Loading...</div>
            </div>
          ) : !isExpanded ? (
            <div className="text-center flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400 shadow-lg shadow-purple-500/40 mb-2 bg-black/20">
                <img 
                  src={layerZeroLogo} 
                  alt="LayerZero" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
              <p className="text-purple-300 text-xs">Cross-Chain Bridge</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-center text-white text-xs overflow-y-auto px-2">
              {/* Header */}
              <div className="flex items-center justify-center mb-2">
                <img src={layerZeroLogo} alt="LayerZero" className="w-4 h-4 mr-1" />
                <h3 className="text-white font-bold text-xs">{title}</h3>
              </div>

              {isConnected ? (
                <div className="space-y-1">
                  <p className="text-xs text-purple-200 mb-1 text-center">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}
                  </p>
                  
                  {/* Token Selection */}
                  <div>
                    <label className="block text-xs text-purple-200">Token</label>
                    <select
                      className="w-full p-0.5 bg-purple-800/50 border border-purple-600 rounded text-white text-xs h-6"
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
                    <label className="block text-xs text-purple-200">Amount</label>
                    <input
                      type="number"
                      className="w-full p-0.5 bg-purple-800/50 border border-purple-600 rounded text-white text-xs h-6"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                    />
                  </div>

                  {/* From Chain */}
                  <div>
                    <label className="block text-xs text-purple-200">From</label>
                    <select
                      className="w-full p-0.5 bg-purple-800/50 border border-purple-600 rounded text-white text-xs h-6"
                      value={fromChain}
                      onChange={(e) => setFromChain(e.target.value)}
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
                    <label className="block text-xs text-purple-200">To</label>
                    <select
                      className="w-full p-0.5 bg-purple-800/50 border border-purple-600 rounded text-white text-xs h-6"
                      value={toChain}
                      onChange={(e) => setToChain(e.target.value)}
                    >
                      {supportedChains.map(chain => (
                        <option key={chain.id} value={chain.id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estimate Fee Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      estimateFee();
                    }}
                    disabled={isLoading || !amount || fromChain === toChain}
                    className="w-full bg-purple-600/80 hover:bg-purple-700 text-white font-bold py-0.5 px-1 rounded text-xs h-6 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Estimating...' : 'Estimate Fee'}
                  </button>

                  {feeEstimate && (
                    <p className="text-xs text-purple-200 text-center">Fee: ${feeEstimate}</p>
                  )}

                  {/* Bridge Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBridge();
                    }}
                    disabled={isLoading || !amount || !feeEstimate || fromChain === toChain}
                    className="w-full bg-green-600/80 hover:bg-green-700 text-white font-bold py-0.5 px-1 rounded text-xs h-6 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Bridging...' : 'Bridge Tokens'}
                  </button>

                  {bridgeStatus && (
                    <p className="text-xs text-purple-200 text-center">{bridgeStatus}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-purple-200 text-center">
                    Connect your wallet to use LayerZero bridging
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

FloatingLayerZeroBubble.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  content: PropTypes.string,
  loading: PropTypes.bool,
  addParticlesToSwarm: PropTypes.func,
  originalQuery: PropTypes.string
};

export default FloatingLayerZeroBubble;