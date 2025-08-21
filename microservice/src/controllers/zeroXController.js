import axios from 'axios';
import { config } from '../config/config.js';

// 0x Protocol API Configuration
const ZEROX_BASE_URL = 'https://api.0x.org';

// Create axios instance for 0x
const zeroXAxios = axios.create({
  baseURL: ZEROX_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add API key (if available)
zeroXAxios.interceptors.request.use((requestConfig) => {
  // 0x API key is optional for some endpoints but recommended for production
  if (config.zeroXApiKey) {
    requestConfig.headers['0x-api-key'] = config.zeroXApiKey;
  }

  if (config.nodeEnv === 'development') {
    console.log('[0x Protocol] Request:', {
      url: (requestConfig.baseURL || '') + (requestConfig.url || ''),
      method: requestConfig.method,
      headers: requestConfig.headers,
    });
  }
  return requestConfig;
});

// Response interceptor for logging
zeroXAxios.interceptors.response.use(
  (response) => {
    if (config.nodeEnv === 'development') {
      console.log('[0x Protocol] Response:', response.data);
    }
    return response;
  },
  (error) => {
    if (config.nodeEnv === 'development') {
      console.error('[0x Protocol] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    return Promise.reject(error);
  }
);

/**
 * 0x Protocol Controller class
 */
export class ZeroXController {
  
  /**
   * Get swap quote from 0x API
   */
  static async getSwapQuote(req, res) {
    try {
      const { sellToken, buyToken, sellAmount, buyAmount, takerAddress, slippagePercentage } = req.query;

      // Validate required fields
      if (!sellToken || !buyToken) {
        return res.status(400).json({
          error: 'sellToken and buyToken are required',
          code: 'MISSING_REQUIRED_PARAMS'
        });
      }

      if (!sellAmount && !buyAmount) {
        return res.status(400).json({
          error: 'Either sellAmount or buyAmount is required',
          code: 'MISSING_AMOUNT_PARAM'
        });
      }

      // Build query parameters
      const params = {
        sellToken,
        buyToken,
        ...(sellAmount && { sellAmount }),
        ...(buyAmount && { buyAmount }),
        ...(takerAddress && { takerAddress }),
        ...(slippagePercentage && { slippagePercentage }),
      };

      console.log('[0x] Fetching swap quote with params:', params);

      // Make request to 0x API
      const response = await zeroXAxios.get('/swap/v1/quote', { params });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[0x] Swap quote error:', error);
      
      if (error.response) {
        // API error response
        return res.status(error.response.status).json({
          error: error.response.data?.reason || 'Failed to fetch swap quote',
          code: 'ZEROX_API_ERROR',
          details: error.response.data
        });
      } else if (error.request) {
        // Network error
        return res.status(503).json({
          error: '0x Protocol service unavailable',
          code: 'ZEROX_SERVICE_UNAVAILABLE'
        });
      } else {
        // Other error
        return res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Get swap price (lighter version of quote)
   */
  static async getSwapPrice(req, res) {
    try {
      const { sellToken, buyToken, sellAmount, buyAmount } = req.query;

      // Validate required fields
      if (!sellToken || !buyToken) {
        return res.status(400).json({
          error: 'sellToken and buyToken are required',
          code: 'MISSING_REQUIRED_PARAMS'
        });
      }

      if (!sellAmount && !buyAmount) {
        return res.status(400).json({
          error: 'Either sellAmount or buyAmount is required',
          code: 'MISSING_AMOUNT_PARAM'
        });
      }

      // Build query parameters
      const params = {
        sellToken,
        buyToken,
        ...(sellAmount && { sellAmount }),
        ...(buyAmount && { buyAmount }),
      };

      console.log('[0x] Fetching swap price with params:', params);

      // Make request to 0x API
      const response = await zeroXAxios.get('/swap/v1/price', { params });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[0x] Swap price error:', error);
      
      if (error.response) {
        // API error response
        return res.status(error.response.status).json({
          error: error.response.data?.reason || 'Failed to fetch swap price',
          code: 'ZEROX_API_ERROR',
          details: error.response.data
        });
      } else if (error.request) {
        // Network error
        return res.status(503).json({
          error: '0x Protocol service unavailable',
          code: 'ZEROX_SERVICE_UNAVAILABLE'
        });
      } else {
        // Other error
        return res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Get supported tokens list
   */
  static async getTokens(req, res) {
    try {
      console.log('[0x] Fetching supported tokens');

      // Make request to 0x API
      const response = await zeroXAxios.get('/swap/v1/tokens');

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[0x] Tokens fetch error:', error);
      
      if (error.response) {
        // API error response
        return res.status(error.response.status).json({
          error: error.response.data?.reason || 'Failed to fetch tokens',
          code: 'ZEROX_API_ERROR',
          details: error.response.data
        });
      } else if (error.request) {
        // Network error
        return res.status(503).json({
          error: '0x Protocol service unavailable',
          code: 'ZEROX_SERVICE_UNAVAILABLE'
        });
      } else {
        // Other error
        return res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Get gas price estimates
   */
  static async getGasPrice(req, res) {
    try {
      console.log('[0x] Fetching gas price estimates');

      // Make request to 0x API
      const response = await zeroXAxios.get('/swap/v1/gas_price');

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[0x] Gas price error:', error);
      
      if (error.response) {
        // API error response
        return res.status(error.response.status).json({
          error: error.response.data?.reason || 'Failed to fetch gas price',
          code: 'ZEROX_API_ERROR',
          details: error.response.data
        });
      } else if (error.request) {
        // Network error
        return res.status(503).json({
          error: '0x Protocol service unavailable',
          code: 'ZEROX_SERVICE_UNAVAILABLE'
        });
      } else {
        // Other error
        return res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }

  /**
   * Get order book for a token pair
   */
  static async getOrderBook(req, res) {
    try {
      const { baseToken, quoteToken, perPage } = req.query;

      // Validate required fields
      if (!baseToken || !quoteToken) {
        return res.status(400).json({
          error: 'baseToken and quoteToken are required',
          code: 'MISSING_REQUIRED_PARAMS'
        });
      }

      // Build query parameters
      const params = {
        baseToken,
        quoteToken,
        ...(perPage && { perPage }),
      };

      console.log('[0x] Fetching order book with params:', params);

      // Make request to 0x API
      const response = await zeroXAxios.get('/sra/v4/orderbook', { params });

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[0x] Order book error:', error);
      
      if (error.response) {
        // API error response
        return res.status(error.response.status).json({
          error: error.response.data?.reason || 'Failed to fetch order book',
          code: 'ZEROX_API_ERROR',
          details: error.response.data
        });
      } else if (error.request) {
        // Network error
        return res.status(503).json({
          error: '0x Protocol service unavailable',
          code: 'ZEROX_SERVICE_UNAVAILABLE'
        });
      } else {
        // Other error
        return res.status(500).json({
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }
}
