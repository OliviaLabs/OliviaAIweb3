import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

// Cache to prevent duplicate API calls
const twitterCache = new Map();
const CACHE_DURATION = 300000; // 5 minutes

export const twitterService = {
  // Search Twitter for tweets (via backend plugin)
  async searchTweets(query, searchType = 'Latest') {
    // Check cache first
    const cacheKey = `${query}:${searchType}`;
    const cached = twitterCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[Twitter] Using cached response for:', query);
      return cached.data;
    }

    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/twitter/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN || 'dev-token'}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({ query, search_type: searchType })
      });

      if (!response.ok) {
        // If rate limited, return cached data if available (even if expired)
        if (response.status === 429 && cached) {
          console.log('[Twitter] Rate limited, using stale cache for:', query);
          return cached.data;
        }
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.success ? data : { success: true, tweets: [], count: 0, query, search_type: searchType };
      
      // Cache the result
      twitterCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error('Twitter search error:', error);
      // Return cached data if available (even if expired) on error
      if (cached) {
        console.log('[Twitter] Error occurred, using stale cache for:', query);
        return cached.data;
      }
      throw error;
    }
  },

  // Get trending crypto tweets
  async getTrendingCrypto() {
    try {
      return await this.searchTweets('cryptocurrency', 'Top');
    } catch (error) {
      console.error('Twitter trending crypto error:', error);
      throw error;
    }
  },

  // Convenience wrapper for tickers like $BTC, $ETH
  async searchTicker(ticker) {
    try {
      const q = ticker?.startsWith('$') ? ticker : `$${ticker}`;
      return await this.searchTweets(q, 'Latest');
    } catch (error) {
      console.error('Twitter searchTicker error:', error);
      throw error;
    }
  }
};
