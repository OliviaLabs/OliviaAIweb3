export function protokols_trendingKOLsBubble(data) {
  const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
  return {
    title: 'Protokols Trending KOLs',
    type: 'kol_trending',
    items: items.slice(0, 50).map(k => ({
      username: k.username || k.handle,
      name: k.name || k.display_name,
      score: k.score || k.views || 0
    })),
    timestamp: new Date().toISOString()
  };
}


