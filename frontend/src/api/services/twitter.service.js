import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

export const twitterService = {
  // Search Twitter for tweets (via backend plugin)
  async searchTweets(query, searchType = 'Latest') {
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
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data : { success: true, tweets: [], count: 0, query, search_type: searchType };
    } catch (error) {
      console.error('Twitter search error:', error);
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
