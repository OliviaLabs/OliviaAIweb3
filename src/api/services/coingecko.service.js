// CoinGecko API Service (Free, no auth required)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const coingeckoService = {
  /**
   * Get market data for top cryptocurrencies
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of coins to fetch (default: 100)
   * @param {string} options.timeframe - Price change timeframe: '24h', '7d', '30d', '1y'
   * @returns {Promise<Array>} Array of coin data
   */
  async getTopCoins(options = {}) {
    const {
      limit = 30, // Reduced from 100 to 30 for better visualization
      timeframe = '24h'
    } = options;

    try {
      // Map timeframe to CoinGecko parameter format
      const priceChangeParam = timeframe === '24h' ? '24h' : 
                               timeframe === '7d' ? '7d' : 
                               timeframe === '30d' ? '30d' : 
                               timeframe === '1y' ? '1y' : '24h';

      const url = `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d,1y`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform to our format
      return data.map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        priceChange1h: coin.price_change_percentage_1h_in_currency || 0,
        priceChange24h: coin.price_change_percentage_24h || 0,
        priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
        priceChange30d: coin.price_change_percentage_30d_in_currency || 0,
        priceChange1y: coin.price_change_percentage_1y_in_currency || 0,
        image: coin.image,
        rank: coin.market_cap_rank
      }));
    } catch (error) {
      console.error('Error fetching CoinGecko data:', error);
      throw error;
    }
  },

  /**
   * Get bubble map data formatted for D3
   * @param {string} timeframe - '1h', '24h', '7d', '30d', '1y'
   * @returns {Promise<Array>} Formatted bubble data
   */
  async getBubbleMapData(timeframe = '24h') {
    try {
      const coins = await this.getTopCoins({ limit: 100, timeframe });

      // Format for bubble visualization
      return coins.map(coin => {
        // Select the right price change based on timeframe
        let priceChange;
        switch(timeframe) {
          case '1h':
            priceChange = coin.priceChange1h;
            break;
          case '24h':
            priceChange = coin.priceChange24h;
            break;
          case '7d':
            priceChange = coin.priceChange7d;
            break;
          case '30d':
            priceChange = coin.priceChange30d;
            break;
          case '1y':
            priceChange = coin.priceChange1y;
            break;
          default:
            priceChange = coin.priceChange24h;
        }

        return {
          symbol: coin.symbol,
          name: coin.name,
          value: coin.marketCap, // Use market cap for bubble size
          priceChange: priceChange || 0,
          volume: coin.volume24h,
          rank: coin.rank
        };
      });
    } catch (error) {
      console.error('Error getting bubble map data:', error);
      throw error;
    }
  },

  /**
   * Get trending coins from CoinGecko
   * @returns {Promise<Object>} Trending coins data
   */
  async getTrending() {
    try {
      const url = `${COINGECKO_API}/search/trending`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko trending API error: ${response.status}`);
      }

      const data = await response.json();
      return data; // Returns { coins: [...], nfts: [...], categories: [...] }
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      throw error;
    }
  },

  /**
   * Get simple price data for specific coins
   * @param {Array<string>} ids - Array of coin IDs (e.g., ['bitcoin', 'ethereum'])
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Price data object
   */
  async getPrices(ids, options = {}) {
    try {
      const {
        vs_currencies = 'usd',
        include_market_cap = true,
        include_24hr_vol = true,
        include_24hr_change = true,
        include_last_updated_at = true
      } = options;

      const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
      const url = `${COINGECKO_API}/simple/price?ids=${idsParam}&vs_currencies=${vs_currencies}&include_market_cap=${include_market_cap}&include_24hr_vol=${include_24hr_vol}&include_24hr_change=${include_24hr_change}&include_last_updated_at=${include_last_updated_at}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`CoinGecko price API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
  }
};
