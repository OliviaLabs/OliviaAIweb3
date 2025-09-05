import React, { useState, useEffect } from 'react';
import { curveService } from '../../api/services/curve.service.js';

const FloatingCurveBubble = ({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  loading, 
  addParticlesToSwarm,
  position = { x: 400, y: 200 }
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [poolData, setPoolData] = useState(null);
  const [stablecoinPools, setStablecoinPools] = useState(null);
  const [curveToken, setCurveToken] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && !poolData) {
      loadCurveData();
    }
  }, [isOpen]);

  const loadCurveData = async () => {
    try {
      const [pools, stablePools, token] = await Promise.all([
        curveService.getPools(),
        curveService.getStablecoinRates(),
        curveService.getCurveTokenInfo()
      ]);
      
      setPoolData(pools);
      setStablecoinPools(stablePools);
      setCurveToken(token);
    } catch (error) {
      console.error('Curve data load error:', error);
    }
  };

  const handleMouseDown = (e) => {
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
    
    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 200;
    
    position.x = Math.max(0, Math.min(newX, maxX));
    position.y = Math.max(0, Math.min(newY, maxY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  const formatVolume = (volume) => {
    if (!volume) return 'N/A';
    const vol = parseFloat(volume);
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    const p = parseFloat(price);
    if (p >= 1000) return `$${p.toFixed(0)}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(6)}`;
  };

  const formatAPY = (apy) => {
    if (!apy) return 'N/A';
    return `${(apy * 100).toFixed(2)}%`;
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isExpanded ? 'w-96 h-96' : 'w-64 h-48'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: position.x,
        top: position.y,
        transform: isExpanded ? 'scale(1.1)' : 'scale(1)',
        boxShadow: '0 10px 30px rgba(0, 191, 255, 0.3)'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-black border-2 border-blue-300 rounded-lg h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-900 bg-opacity-50 p-3 flex justify-between items-center">
          <h3 className="text-blue-300 font-bold text-sm flex items-center">
            📈 {title || 'Curve - Base'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-300 hover:text-blue-100 text-xs px-2 py-1 rounded border border-blue-300"
            >
              {isExpanded ? '−' : '+'}
            </button>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-200 text-xs px-2 py-1 rounded border border-red-400"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 overflow-y-auto">
          {loading ? (
            <div className="text-blue-300 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading Curve data...
            </div>
          ) : (
            <div className="space-y-3">
              {/* Curve Token */}
              {curveToken && (
                <div className="text-center p-2 bg-blue-900 bg-opacity-30 rounded">
                  <div className="text-blue-300 font-bold">
                    CRV: {formatPrice(curveToken.price)}
                  </div>
                </div>
              )}

              {/* Stablecoin Pools */}
              {stablecoinPools && stablecoinPools.length > 0 && (
                <div>
                  <div className="text-blue-300 font-semibold text-xs mb-2">
                    Stablecoin Pools
                  </div>
                  <div className="space-y-2">
                    {stablecoinPools.slice(0, isExpanded ? 5 : 3).map((pool, index) => (
                      <div key={pool.address || index} className="text-xs bg-blue-900 bg-opacity-20 p-2 rounded">
                        <div className="text-blue-300 font-medium">
                          {pool.name || pool.symbol}
                        </div>
                        <div className="text-blue-400">
                          TVL: {formatVolume(pool.tvl)}
                        </div>
                        <div className="text-blue-400">
                          APY: {formatAPY(pool.apy)}
                        </div>
                        {isExpanded && pool.coins && (
                          <div className="text-blue-400">
                            Coins: {pool.coins.length}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Pools */}
              {poolData && poolData.length > 0 && isExpanded && (
                <div>
                  <div className="text-blue-300 font-semibold text-xs mb-2">
                    All Pools
                  </div>
                  <div className="space-y-1">
                    {poolData.slice(0, 3).map((pool, index) => (
                      <div key={pool.address || index} className="text-xs bg-blue-900 bg-opacity-20 p-2 rounded">
                        <div className="text-blue-300 font-medium">
                          {pool.name || pool.symbol}
                        </div>
                        <div className="text-blue-400">
                          TVL: {formatVolume(pool.tvl)}
                        </div>
                        <div className="text-blue-400">
                          APY: {formatAPY(pool.apy)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => window.open('https://curve.fi', '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Trade on Curve
                </button>
                {isExpanded && (
                  <button
                    onClick={() => window.open('https://curve.fi/factory', '_blank')}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs py-2 px-3 rounded transition-colors"
                  >
                    View Pools
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloatingCurveBubble;
