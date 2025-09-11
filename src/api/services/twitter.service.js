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
      
      // Process the response to extract relevant tweet data
      let tweets = [];
      if (data.timeline && Array.isArray(data.timeline)) {
        tweets = data.timeline.map(tweet => ({
          id: tweet.id_str || tweet.id,
          text: tweet.full_text || tweet.text,
          user: {
            username: tweet.user?.screen_name,
            name: tweet.user?.name,
            profile_image_url: tweet.user?.profile_image_url_https
          },
          created_at: tweet.created_at,
          favorite_count: tweet.favorite_count || 0,
          retweet_count: tweet.retweet_count || 0,
          reply_count: tweet.reply_count || 0,
          url: `https://twitter.com/${tweet.user?.screen_name}/status/${tweet.id_str || tweet.id}`
        }));
      }

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
  }
};
