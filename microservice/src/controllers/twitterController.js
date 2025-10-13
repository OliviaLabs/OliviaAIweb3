const RAPIDAPI_KEY = 'f96f96fff6msh857435ff96d630ap1eadcdjsn1908e20abe18';

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

    const response = await fetch(`https://twitter-api45.p.rapidapi.com/search.php?query=${encodeURIComponent(query)}&search_type=${search_type}`, {
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
        id: tweet.id_str || tweet.id || `tweet-${Math.random()}`,
        text: tweet.full_text || tweet.text || '',
        user: {
          username: tweet.user?.screen_name || tweet.author?.username || 'unknown',
          name: tweet.user?.name || tweet.author?.name || 'Unknown User',
          profile_image_url: tweet.user?.profile_image_url_https || tweet.user?.profile_image_url || tweet.author?.profile_image_url || '/Olivia-ai-LOGO.png'
        },
        created_at: tweet.created_at || new Date().toISOString(),
        favorite_count: tweet.favorite_count || 0,
        retweet_count: tweet.retweet_count || 0,
        reply_count: tweet.reply_count || 0,
        url: tweet.url || `https://twitter.com/${tweet.user?.screen_name || tweet.author?.username || 'unknown'}/status/${tweet.id_str || tweet.id}`
      }));
    }

    console.log(`🐦 Found ${tweets.length} tweets for query: "${query}"`);

    res.json({
      success: true,
      query,
      search_type,
      tweets,
      count: tweets.length
    });

  } catch (error) {
    console.error('Twitter search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search Twitter',
      details: 'Twitter API service unavailable'
    });
  }
};
