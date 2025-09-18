import axios from 'axios';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Rate limiting cache
const requestCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds
const REQUEST_DELAY = 1000; // 1 second between requests

let lastRequestTime = 0;

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
    const delay = REQUEST_DELAY - timeSinceLastRequest;
    console.log(`[CoinGecko] Rate limiting: waiting ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
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
  (error) => {
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
    
    // Handle rate limiting
    if (error?.response?.status === 429) {
      console.warn('[CoinGecko] Rate limited - requests are being cached and throttled');
    }
    
    return Promise.reject(error);
  }
);

export default axiosCoingecko;
