import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

/**
 * CoinStats API Service via Microservice
 * Full-featured crypto data with API key secured in microservice
 * Includes rate limiting and caching to prevent 429 errors
 */

// Rate limiting and caching configuration
const requestCache = new Map();
const CACHE_DURATION = 600000; // 10 minutes cache (increased to reduce API calls)
const REQUEST_DELAY = 1500; // 1.5 seconds between requests
const REQUEST_JITTER_MS = 300; // Random jitter to avoid burst alignment
const MAX_RETRIES = 0; // Don't retry on rate limit - just use cache or skip

let lastRequestTime = 0;
let requestQueue = Promise.resolve();

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate-limited fetch wrapper with caching and retry logic
 */
async function rateLimitedFetch(url, cacheKey, retryCount = 0) {
  // Check cache first
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[CoinStats] Using cached response for:', url);
    return cached.data;
  }

  // Rate limiting - ensure minimum delay between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    const baseDelay = REQUEST_DELAY - timeSinceLastRequest;
    const jitter = Math.floor(Math.random() * REQUEST_JITTER_MS);
    const delay = baseDelay + jitter;
    console.log(`[CoinStats] Rate limiting: waiting ${delay}ms`);
    await sleep(delay);
  }
  lastRequestTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
        'Origin': window.location.origin
      }
    });

    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        // Check if we have cached data to use while waiting
        if (cached) {
          console.warn('[CoinStats] Rate limited but serving stale cache');
          return cached.data;
        }
        
        const backoffBase = 3000; // 3 seconds
        const backoff = Math.min(backoffBase * 2 ** retryCount, 10000);
        const jitter = Math.floor(Math.random() * 1000);
        const waitMs = backoff + jitter;
        console.warn(`[CoinStats] Rate limited (429). Retrying ${retryCount + 1}/${MAX_RETRIES} after ${waitMs}ms`);
        await sleep(waitMs);
        return rateLimitedFetch(url, cacheKey, retryCount + 1);
      }
      
      // If we have cached data (even stale), use it as last resort
      if (cached) {
        console.warn('[CoinStats] Max retries reached, serving stale cache');
        return cached.data;
      }
      
      // Don't throw - return null to let caller handle gracefully
      console.warn('[CoinStats] Rate limited with no cache available');
      return null;
    }

    if (!response.ok) {
      // On other errors, try to serve cached data if available
      if (cached && (response.status >= 500 || response.status === 503)) {
        console.warn(`[CoinStats] Server error ${response.status}, serving stale cache`);
        return cached.data;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const result = data.success ? data.data : data;
    
    // Cache successful response
    requestCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    console.log('[CoinStats] Response cached:', cacheKey);
    return result;
    
  } catch (error) {
    // On network errors, serve cached data if available
    if (cached && error.message?.includes('fetch')) {
      console.warn('[CoinStats] Network error, serving stale cache');
      return cached.data;
    }
    console.error('CoinStats fetch error:', error);
    // Return null instead of throwing to allow graceful handling
    return null;
  }
}

export const coinstatsService = {
  // Get coin prices and market data
  async getCoins(limit = 10, page = 1) {
    const url = `${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/coins?page=${page}&limit=${limit}&currency=USD`;
    const cacheKey = `coins:${page}:${limit}`;
    
    // Queue the request to ensure sequential processing
    return requestQueue = requestQueue.then(() => rateLimitedFetch(url, cacheKey)).catch(error => {
      console.error('CoinStats coins fetch error:', error);
      return null; // Return null instead of throwing
    });
  },

  // Get specific coin data
  async getCoin(coinId) {
    const url = `${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/coins/${coinId}?currency=USD`;
    const cacheKey = `coin:${coinId}`;
    
    // Queue the request to ensure sequential processing
    return requestQueue = requestQueue.then(() => rateLimitedFetch(url, cacheKey)).catch(error => {
      console.error('CoinStats coin fetch error:', error);
      return null; // Return null instead of throwing
    });
  },

  // Get market data overview
  async getMarkets(limit = 50) {
    const url = `${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/markets?limit=${limit}&currency=USD&sortBy=rank`;
    const cacheKey = `markets:${limit}`;
    
    // Queue the request to ensure sequential processing
    return requestQueue = requestQueue.then(() => rateLimitedFetch(url, cacheKey)).catch(error => {
      console.error('CoinStats markets fetch error:', error);
      return null; // Return null instead of throwing
    });
  },

  // Search for coins by query
  async searchCoins(query) {
    const url = `${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/search?query=${encodeURIComponent(query)}&currency=USD`;
    const cacheKey = `search:${query}`;
    
    // Queue the request to ensure sequential processing
    return requestQueue = requestQueue.then(() => rateLimitedFetch(url, cacheKey)).catch(error => {
      console.error('CoinStats search error:', error);
      return null; // Return null instead of throwing
    });
  },

  // Get portfolio insights
  async getPortfolioInsights() {
    const url = `${OPENAI_MICROSERVICE_CONFIG.URL}/api/coinstats/portfolio-insights?limit=5&sortBy=marketCap`;
    const cacheKey = 'portfolio:insights';
    
    // Queue the request to ensure sequential processing
    return requestQueue = requestQueue.then(() => rateLimitedFetch(url, cacheKey)).catch(error => {
      console.error('CoinStats portfolio insights error:', error);
      return null; // Return null instead of throwing
    });
  },

  // Clear cache (useful for manual refresh)
  clearCache() {
    requestCache.clear();
    console.log('[CoinStats] Cache cleared');
  }
};