import axios from 'axios';
import { config } from '../config/config.js';

// CoinGecko API Configuration
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Create axios instance for CoinGecko
const coingeckoAxios = axios.create({
  baseURL: COINGECKO_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
coingeckoAxios.interceptors.request.use((requestConfig) => {
  if (config.nodeEnv === 'development') {
    console.log('[CoinGecko] Request:', {
      url: (requestConfig.baseURL || '') + (requestConfig.url || ''),
      method: requestConfig.method,
    });
  }
  return requestConfig;
});

// Response interceptor for logging
coingeckoAxios.interceptors.response.use(
  (response) => {
    if (config.nodeEnv === 'development') {
      console.log('[CoinGecko] Response received');
    }
    return response;
  },
  (error) => {
    if (config.nodeEnv === 'development') {
      console.error('[CoinGecko] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

/**
 * CoinGecko Controller class
 */
export class CoinGeckoController {
  
  /**
   * Get trending coins
   */
  static async getTrending(req, res) {
    try {
      const response = await coingeckoAxios.get('/search/trending');

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinGecko getTrending error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch trending coins',
        code: 'COINGECKO_TRENDING_ERROR'
      });
    }
  }

  /**
   * Get simple price data for specific coins
   */
  static async getPrices(req, res) {
    try {
      const { 
        ids, // comma-separated coin IDs or array
        vs_currencies = 'usd',
        include_market_cap = true,
        include_24hr_vol = true,
        include_24hr_change = true,
        include_last_updated_at = true
      } = req.query;

      if (!ids) {
        return res.status(400).json({
          success: false,
          error: 'Coin IDs are required',
          code: 'MISSING_IDS'
        });
      }

      const response = await coingeckoAxios.get('/simple/price', {
        params: {
          ids,
          vs_currencies,
          include_market_cap,
          include_24hr_vol,
          include_24hr_change,
          include_last_updated_at
        }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinGecko getPrices error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch prices',
        code: 'COINGECKO_PRICE_ERROR'
      });
    }
  }

  /**
   * Get coin details by ID
   */
  static async getCoinDetails(req, res) {
    try {
      const { coinId } = req.params;

      if (!coinId) {
        return res.status(400).json({
          success: false,
          error: 'Coin ID is required',
          code: 'MISSING_COIN_ID'
        });
      }

      const response = await coingeckoAxios.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: true,
          developer_data: false,
          sparkline: false
        }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinGecko getCoinDetails error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch coin details',
        code: 'COINGECKO_DETAILS_ERROR'
      });
    }
  }

  /**
   * Get market data for top cryptocurrencies
   * Supports category filtering (e.g., category=ton-ecosystem)
   */
  static async getMarkets(req, res) {
    try {
      const {
        vs_currency = 'usd',
        order = 'market_cap_desc',
        per_page = 10,
        page = 1,
        sparkline = false,
        price_change_percentage = '24h',
        category = null  // ⭐ NEW: Filter by category like "ton-ecosystem"
      } = req.query;

      const params = {
        vs_currency,
        order,
        per_page: parseInt(per_page),
        page: parseInt(page),
        sparkline,
        price_change_percentage
      };

      // Only add category if provided
      if (category) {
        params.category = category;
      }

      const response = await coingeckoAxios.get('/coins/markets', {
        params
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinGecko getMarkets error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to fetch market data',
        code: 'COINGECKO_MARKETS_ERROR'
      });
    }
  }

  /**
   * Search for coins, categories, and markets
   */
  static async search(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          code: 'MISSING_QUERY'
        });
      }

      const response = await coingeckoAxios.get('/search', {
        params: { query }
      });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('CoinGecko search error:', error);
      
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to search',
        code: 'COINGECKO_SEARCH_ERROR'
      });
    }
  }
}
