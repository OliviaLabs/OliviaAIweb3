const RAPIDAPI_KEY = 'f96f96fff6msh857435ff96d630ap1eadcdjsn1908e20abe18';
const RAPIDAPI_HOST = 'twitter-api45.p.rapidapi.com';

// Cache for profile images to avoid duplicate API calls
const profileCache = new Map();

/**
 * Fetch user profile to get high-quality avatar
 */
async function fetchUserProfile(screenname) {
  // Check cache first
  if (profileCache.has(screenname)) {
    return profileCache.get(screenname);
  }

  try {
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/screenname.php?screenname=${screenname}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      const profileData = {
        avatar: data.avatar || '/Olivia-ai-LOGO.png',
        name: data.name || screenname,
        verified: data.blue_verified || false
      };
      
      // Cache it
      profileCache.set(screenname, profileData);
      console.log(`✅ Fetched profile for @${screenname}: ${profileData.avatar}`);
      return profileData;
    }
  } catch (error) {
    console.error(`❌ Failed to fetch profile for @${screenname}:`, error);
  }

  return null;
}

export const searchTwitter = async (req, res) => {
  try {
    const { query, search_type = 'Top' } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required'
      });
    }

    console.log(`🐦 Twitter search request: "${query}" (${search_type})`);

    // Step 1: Search for tweets
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/search.php?query=${encodeURIComponent(query)}&search_type=${search_type}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🐦 Raw API response keys:', Object.keys(data));
    console.log('🐦 First tweet sample:', JSON.stringify(data.timeline?.[0] || data.tweets?.[0] || data[0], null, 2));
    
    // Process tweets
    let tweets = [];
    const timelineData = data.timeline || data.tweets || data;
    
    if (Array.isArray(timelineData)) {
      console.log(`🐦 Processing ${timelineData.length} tweets...`);
      
      // First pass: Extract basic tweet data
      const basicTweets = timelineData.map(tweet => {
        // Parse the Twitter API response structure
        const username = tweet.screen_name || tweet.user_info?.screen_name || 'unknown';
        const displayName = tweet.user_info?.name || tweet.name || username;
        const avatar = tweet.user_info?.avatar || null;
        
        return {
          id: tweet.tweet_id || tweet.id_str || tweet.id || `tweet-${Math.random()}`,
          text: tweet.text || tweet.full_text || '',
          username: username,
          displayName: displayName,
          avatar: avatar, // Store the avatar from the search response
          created_at: tweet.created_at || new Date().toISOString(),
          favorite_count: tweet.favorites || tweet.favorite_count || 0,
          retweet_count: tweet.retweets || tweet.retweet_count || 0,
          reply_count: tweet.replies || tweet.reply_count || 0,
          url: tweet.url || `https://twitter.com/${username}/status/${tweet.tweet_id || tweet.id_str || tweet.id}`
        };
      });

      // Step 2: Use avatars from the search response (already included!)
      // No need to make additional API calls - the search endpoint includes user_info with avatars
      
      tweets = basicTweets.map(tweet => {
        return {
          id: tweet.id,
          text: tweet.text,
          user: {
            username: tweet.username,
            name: tweet.displayName,
            profile_image_url: tweet.avatar || '/Olivia-ai-LOGO.png'
          },
          created_at: tweet.created_at,
          favorite_count: tweet.favorite_count,
          retweet_count: tweet.retweet_count,
          reply_count: tweet.reply_count,
          url: tweet.url
        };
      });
    }

    console.log(`🐦 ✅ Found ${tweets.length} tweets for query: "${query}"`);
    if (tweets.length > 0) {
      console.log('🐦 Sample tweet:', {
        user: tweets[0].user.username,
        name: tweets[0].user.name,
        avatar: tweets[0].user.profile_image_url
      });
    }

    res.json({
      success: true,
      query,
      search_type,
      tweets,
      count: tweets.length
    });

  } catch (error) {
    console.error('🐦 ❌ Twitter search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search Twitter',
      details: 'Twitter API service unavailable'
    });
  }
};
