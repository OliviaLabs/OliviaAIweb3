/**
 * Twitter API Service - Direct API calls (like CoinGecko)
 * Uses RapidAPI for Twitter search
 */

const RAPIDAPI_KEY = 'f96f96fff6msh857435ff96d630ap1eadcdjsn1908e20abe18';

export const twitterService = {
  // Search Twitter for tweets
  async searchTweets(query, searchType = 'Latest') {
    try {
      console.log(`🐦 Twitter search: "${query}" (${searchType})`);
      
      const response = await fetch(`https://twitter-api45.p.rapidapi.com/search.php?query=${encodeURIComponent(query)}&search_type=${searchType}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'twitter-api45.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Debug: Log the raw API response to see the actual structure
      console.log('🐦 Raw Twitter API response:', JSON.stringify(data, null, 2));
      if (data.timeline && data.timeline.length > 0) {
        console.log('🐦 First tweet structure:', JSON.stringify(data.timeline[0], null, 2));
      }
      
      // Process the response to extract relevant tweet data (robust to multiple schemas)
      let tweets = [];
      const rawTimeline = Array.isArray(data.timeline) ? data.timeline
                        : Array.isArray(data.tweets) ? data.tweets
                        : [];

      tweets = rawTimeline.map(t => {
        const id = t.id_str || t.id || t.tweet_id || t.tweet?.id_str || t.tweet?.id;
        const text = t.full_text || t.text || t.tweet?.full_text || t.tweet?.text || '';
        const username = t.user?.screen_name || t.author?.username || t.screen_name || t.user_info?.screen_name || 'anonymous';
        const name = t.user?.name || t.author?.name || t.user_info?.name || username;
        const profile_image_url = t.user?.profile_image_url_https || t.author?.profile_image_url || t.user_info?.avatar || t.user?.profile_image_url || '';
        const favorite_count = t.favorite_count || t.favorites || t.public_metrics?.like_count || 0;
        const retweet_count = t.retweet_count || t.retweets || t.public_metrics?.retweet_count || 0;
        const reply_count = t.reply_count || t.replies || t.public_metrics?.reply_count || 0;
        const created_at = t.created_at || t.tweet?.created_at;
        const finalUser = { username, name, profile_image_url };
        const url = username && id
          ? `https://twitter.com/${username}/status/${id}`
          : id ? `https://twitter.com/i/status/${id}` : undefined;

        return { id, text, user: finalUser, created_at, favorite_count, retweet_count, reply_count, url };
      }).filter(x => x.id && x.text);

      console.log(`🐦 Found ${tweets.length} tweets for query: "${query}"`);

      return {
        success: true,
        query,
        search_type: searchType,
        tweets,
        count: tweets.length
      };

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
