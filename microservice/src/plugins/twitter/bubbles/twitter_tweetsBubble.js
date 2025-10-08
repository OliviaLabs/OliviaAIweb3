export function twitter_tweetsBubble(data) {
  const tweets = Array.isArray(data?.tweets) ? data.tweets : Array.isArray(data) ? data : [];
  return {
    title: 'Twitter Tweets',
    type: 'tweets',
    items: tweets.slice(0, 50).map(t => ({
      id: t.id,
      text: t.text,
      user: t.user,
      url: t.url,
      likes: t.favorite_count || 0,
      retweets: t.retweet_count || 0
    })),
    timestamp: new Date().toISOString()
  };
}


