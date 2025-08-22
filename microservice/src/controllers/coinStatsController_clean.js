import axios from 'axios';
import { config } from '../config/config.js';

// CoinStats API Configuration
const COINSTATS_BASE_URL = 'https://openapiv1.coinstats.app';

// Create axios instance for CoinStats
const coinStatsAxios = axios.create({
  baseURL: COINSTATS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': config.coinStatsApiKey,
  },
});

// Request interceptor for logging
coinStatsAxios.interceptors.request.use((requestConfig) => {
  if (config.nodeEnv === 'development') {
    console.log('[CoinStats] Request:', {
      url: (requestConfig.baseURL || '') + (requestConfig.url || ''),
      method: requestConfig.method,
    });
  }
  return requestConfig;
});

// Response interceptor for logging
coinStatsAxios.interceptors.response.use(
  (response) => {
    if (config.nodeEnv === 'development') {
      console.log('[CoinStats] Response:', response.data);
    }
    return response;
  },
  (error) => {
    console.error('[CoinStats] Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

/**
 * CoinStats Controller class
 */
export class CoinStatsController {
  
  /**
   * Get coin prices and market data
   */
  static async getCoins(req, res) {
    try {
      const { limit = 10, page = 1, currency = 'USD' } = req.query;
      
      const response = await coinStatsAxios.get('/coins', {
        params: {
          page: parseInt(page),
          limit: parseInt(limit),
          currency
        }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats getCoins error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch coins',
        code: 'COINSTATS_COINS_ERROR'
      });
    }
  }

  /**
   * Get specific coin data
   */
  static async getCoin(req, res) {
    try {
      const { coinId } = req.params;
      const { currency = 'USD' } = req.query;

      const response = await coinStatsAxios.get(`/coins/${coinId}`, {
        params: { currency }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats getCoin error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch coin data',
        code: 'COINSTATS_COIN_ERROR'
      });
    }
  }

  /**
   * Get market data
   */
  static async getMarkets(req, res) {
    try {
      const { limit = 10, page = 1, currency = 'USD' } = req.query;

      const response = await coinStatsAxios.get('/markets', {
        params: {
          page: parseInt(page),
          limit: parseInt(limit),
          currency
        }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats getMarkets error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch market data',
        code: 'COINSTATS_MARKETS_ERROR'
      });
    }
  }

  /**
   * Search for coins by query - NO HARDCODED MAPPINGS
   */
  static async searchCoins(req, res) {
    try {
      const { query, currency = 'USD' } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          code: 'MISSING_QUERY'
        });
      }

      console.log(`[CoinStats] Searching for: "${query}"`);

      // Get all coins and search through them dynamically
      const response = await coinStatsAxios.get('/coins', {
        params: { 
          currency,
          limit: 500, // Get more coins to search through
          page: 1
        }
      });
      
      // Search for matching coin by symbol or name
      const coins = response.data.coins || response.data;
      const searchTerm = query.toLowerCase().trim();
      
      let matchedCoin = null;
      
      // Try exact symbol match first (most reliable)
      matchedCoin = coins.find(coin => 
        coin.symbol && coin.symbol.toLowerCase() === searchTerm
      );
      
      // If no exact symbol match, try partial name match
      if (!matchedCoin) {
        matchedCoin = coins.find(coin => 
          coin.name && coin.name.toLowerCase().includes(searchTerm)
        );
      }
      
      // If still no match, try partial symbol match
      if (!matchedCoin) {
        matchedCoin = coins.find(coin => 
          coin.symbol && coin.symbol.toLowerCase().includes(searchTerm)
        );
      }
      
      if (!matchedCoin) {
        console.log(`[CoinStats] No match found for: "${query}"`);
        return res.status(404).json({
          success: false,
          error: `Coin "${query}" not found`,
          code: 'COIN_NOT_FOUND'
        });
      }

      console.log(`[CoinStats] Found match: ${matchedCoin.symbol} (${matchedCoin.name})`);

      // Return in expected format
      res.json({
        success: true,
        data: [matchedCoin], // Return as array for compatibility
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats searchCoins error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search coins',
        code: 'COINSTATS_SEARCH_ERROR'
      });
    }
  }

  /**
   * Get portfolio insights
   */
  static async getPortfolioInsights(req, res) {
    try {
      const { limit = 10, sortBy = 'market_cap' } = req.query;

      const response = await coinStatsAxios.get('/portfolio/insights', {
        params: {
          limit: parseInt(limit),
          sort_by: sortBy
        }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinStats getPortfolioInsights error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch portfolio insights',
        code: 'COINSTATS_PORTFOLIO_ERROR'
      });
    }
  }
}
