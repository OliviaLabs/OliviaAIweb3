import axios from 'axios';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Rate limiting cache
const requestCache = new Map();
const CACHE_DURATION = 120000; // 2 minutes
const REQUEST_DELAY = 1500; // 1.5 seconds between requests
const REQUEST_JITTER_MS = 250; // small jitter to avoid burst alignment

let lastRequestTime = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const axiosCoingecko = axios.create({
  baseURL: COINGECKO_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Rate limiting and caching interceptor
axiosCoingecko.interceptors.request.use(async (config) => {
  const url = (config.baseURL || '') + (config.url || '');
  const cacheKey = `${config.method}:${url}:${JSON.stringify(config.params)}`;
  
  // Check cache first
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('[CoinGecko] Using cached response for:', url);
    // Return cached data as a resolved promise that looks like an axios response
    return Promise.reject({
      isCache: true,
      data: cached.data,
      status: 200,
      statusText: 'OK (Cached)',
      config
    });
  }
  
  // Rate limiting - ensure minimum delay between requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    const baseDelay = REQUEST_DELAY - timeSinceLastRequest;
    const jitter = Math.floor(Math.random() * REQUEST_JITTER_MS);
    const delay = baseDelay + jitter;
    console.log(`[CoinGecko] Rate limiting: waiting ${delay}ms`);
    await sleep(delay);
  }
  lastRequestTime = Date.now();
  
  if (import.meta.env.DEV) {
    console.log('[CoinGecko] Request:', {
      url,
      method: config.method,
    });
  }
  return config;
});

axiosCoingecko.interceptors.response.use(
  (response) => {
    // Cache successful responses
    const url = (response.config.baseURL || '') + (response.config.url || '');
    const cacheKey = `${response.config.method}:${url}:${JSON.stringify(response.config.params)}`;
    requestCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
    
    if (import.meta.env.DEV) {
      console.log('[CoinGecko] Response cached:', response.data);
    }
    return response;
  },
  async (error) => {
    // Handle cached responses
    if (error.isCache) {
      console.log('[CoinGecko] Returning cached data');
      return Promise.resolve({
        data: error.data,
        status: error.status,
        statusText: error.statusText,
        config: error.config
      });
    }
    
    if (import.meta.env.DEV) {
      console.error('[CoinGecko] Error:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      });
    }
    
    // Handle rate limiting and transient errors with cache + retry
    const cfg = error?.config || {};
    const url = (cfg.baseURL || '') + (cfg.url || '');
    const cacheKey = `${cfg.method}:${url}:${JSON.stringify(cfg.params)}`;

    const status = error?.response?.status;

    // If we have a cached response, serve it on 429 or 5xx
    if ((status === 429 || (status >= 500 && status < 600)) && requestCache.has(cacheKey)) {
      const cached = requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.warn('[CoinGecko] Using cached response due to transient error:', status);
        return Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (Cached Fallback)',
          config: cfg
        });
      }
    }

    // Retry with exponential backoff (limited)
    if (status === 429 || (status >= 500 && status < 600)) {
      const maxRetries = 3;
      cfg._retryCount = (cfg._retryCount || 0) + 1;
      if (cfg._retryCount <= maxRetries) {
        const backoffBase = 500; // ms
        const backoff = Math.min(backoffBase * 2 ** (cfg._retryCount - 1), 4000);
        const jitter = Math.floor(Math.random() * REQUEST_JITTER_MS);
        const waitMs = backoff + jitter;
        console.warn(`[CoinGecko] Transient error ${status}. Retrying ${cfg._retryCount}/${maxRetries} after ${waitMs}ms`);
        await sleep(waitMs);
        return axiosCoingecko(cfg);
      }
      console.error('[CoinGecko] Max retries reached');
    }

    return Promise.reject(error);
  }
);

export default axiosCoingecko;
