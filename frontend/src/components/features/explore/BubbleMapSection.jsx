import React, { useState, useEffect, useRef, memo } from 'react';
import { twitterService } from '../../../api/services/twitter.service';
import FloatingBubbles from './FloatingBubbles';

const microserviceUrl = import.meta.env.VITE_MICROSERVICE_URL || 'http://localhost:3000';

function BubbleMapSection({ onTokenClick, loadingToken, setUserInput, handleSendMessageRef, sendMessage }) {
  const [bubbleIsLoading, setBubbleIsLoading] = useState(true);
  const [bubbleData, setBubbleData] = useState([]);
  const timeframe = '24h'; // Fixed to 24 hours only
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double fetch on React StrictMode
    if (hasFetched.current) {
      return;
    }
    
    const fetchBubbleData = async () => {
      hasFetched.current = true; // Mark as fetched immediately
      setBubbleIsLoading(true);
      setError(null);
      
      const CACHE_KEY = 'coingecko_bubble_data';
      const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
      
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < CACHE_DURATION) {
            console.log('✅ Using cached CoinGecko data');
            setBubbleData(data);
            setBubbleIsLoading(false);
            return;
          }
        }
        
        // Fetch fresh data
        console.log('🔄 Fetching fresh CoinGecko data...');
        const response = await fetch(`${microserviceUrl}/api/coingecko/markets?per_page=100&order=market_cap_desc&price_change_percentage=24h`, {
          headers: { 'admin-secret': localStorage.getItem('admin-secret') }
        });
        const result = await response.json();
        const marketData = result.data || [];
        
        // Transform to bubble format
        const data = marketData.map(coin => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          value: coin.market_cap,
          priceChange: coin.price_change_percentage_24h || 0,
          volume: coin.total_volume,
          rank: coin.market_cap_rank
        }));
        
        // Cache the data
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        
        setBubbleData(data);
      } catch (error) {
        console.error("Error fetching CoinGecko data:", error);
        setError(error.message);
        
        // Try to use stale cache if available
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          console.log('⚠️ Using stale cache due to API error');
          setBubbleData(data);
        } else {
          setBubbleData([]);
        }
      } finally {
        setBubbleIsLoading(false);
      }
    };

    fetchBubbleData();
  }, [timeframe]);

  const handleBubbleClick = async (tokenSymbol) => {
    console.log('🎯 Bubble clicked:', tokenSymbol);
    
    // Ensure tokenSymbol is valid
    if (!tokenSymbol) {
      console.error('❌ No token symbol provided');
      return;
    }
    
    // 1. SEND TO AI FIRST - Ask Olivia about this token (send directly, don't wait for input)
    const message = `Tell me about ${tokenSymbol}`;
    console.log(`🤖 Auto-sending to AI: "${message}"`);
    if (sendMessage) {
      // Send directly through WebSocket
      sendMessage(message, [], false, false).catch(err => {
        console.error('Failed to send auto-message:', err);
      });
    }
    // Also show it in the input briefly then clear
    if (setUserInput) {
      setUserInput(message);
      setTimeout(() => setUserInput(''), 100);
    }
    
    // 2. Show loading state for Twitter section
    if (onTokenClick) {
      onTokenClick(tokenSymbol, 'loading');
    }
    
    // 3. Fetch Twitter results in background
    try {
      // Search Twitter for this token with 'Top' to get high engagement tweets
      const results = await twitterService.searchTweets(`$${tokenSymbol}`, 'Top');
      
      // Sort by engagement (likes + retweets + replies)
      const sortedTweets = results.tweets
        .map(tweet => ({
          ...tweet,
          engagement: tweet.favorite_count + tweet.retweet_count + (tweet.reply_count || 0)
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 20); // Top 20 most engaging tweets
      
      console.log(`✅ Found ${sortedTweets.length} tweets for $${tokenSymbol}`);
      
      // Pass the results to parent to update TradingInfluencersSection
      if (onTokenClick) {
        onTokenClick(tokenSymbol, sortedTweets);
      }
    } catch (error) {
      console.error('❌ Twitter search error:', error);
      // Still notify parent with empty array
      if (onTokenClick) {
        onTokenClick(tokenSymbol, []);
      }
    }
  };

  return (
    <>
      <div className="w-full z-10">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            Failed to load data from CoinGecko. Using fallback data.
          </div>
        )}

        {/* Bubble Map */}
        {bubbleIsLoading ? (
          <div className="w-full h-[60vh] md:h-[70vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-[#31F46E] border-t-transparent rounded-full animate-spin"></div>
              <div className="text-white/50">Loading crypto data...</div>
            </div>
          </div>
        ) : bubbleData.length === 0 ? (
          <div className="w-full h-[60vh] md:h-[70vh] flex items-center justify-center">
            <div className="text-white/50">No data available</div>
          </div>
        ) : (
          <FloatingBubbles 
            data={bubbleData} 
            height={typeof window !== 'undefined' ? (window.innerWidth < 768 ? window.innerHeight * 0.6 : window.innerHeight * 0.7) : 500}
            onBubbleClick={handleBubbleClick}
            timeframe={timeframe}
            loadingToken={loadingToken}
          />
        )}
      </div>
    </>
  );
}

// Wrap in memo to prevent re-renders when parent re-renders but props haven't changed
export default memo(BubbleMapSection);
