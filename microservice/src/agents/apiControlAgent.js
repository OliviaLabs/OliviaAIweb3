import { TokenResolverAgent } from './tokenResolverAgent.js';

/**
 * API Control Agent
 * Intelligently decides which APIs to call based on user needs
 * Now with smart caching to avoid duplicate API calls
 */

export class APIControlAgent {
  
  // 🧠 Cache storage for API responses
  static cache = new Map();
  static CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Generate cache key based on dataType and entities
   * Example: "trending-TON", "price-BTC", "trending-Solana"
   */
  static generateCacheKey(dataType, entities) {
    const tokens = entities.tokens?.join(',') || '';
    const blockchains = entities.blockchains?.join(',') || '';
    const other = entities.other?.join(',') || '';
    
    // Create unique key
    const parts = [dataType, blockchains, tokens, other].filter(Boolean);
    return parts.join('-');
  }
  
  /**
   * Check if cache has fresh data for this query
   */
  static getCachedData(cacheKey) {
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_TTL) {
      // Cache expired
      this.cache.delete(cacheKey);
      console.log(`🗑️ [API Cache] Expired: ${cacheKey}`);
      return null;
    }
    
    console.log(`✨ [API Cache] Hit: ${cacheKey} (${Math.round(age / 1000)}s old)`);
    return cached.data;
  }
  
  /**
   * Store data in cache
   */
  static setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 [API Cache] Stored: ${cacheKey}`);
  }
  
  /**
   * Clear cache (useful when subject changes dramatically)
   */
  static clearCache() {
    this.cache.clear();
    console.log(`🧹 [API Cache] Cleared all cache`);
  }
  
  /**
   * Map of data types to available API endpoints
   */
  static API_CAPABILITIES = {
    price: [
      { api: '/api/coingecko/prices', params: (entities) => ({ ids: entities.tokens?.[0] }) },
      { api: '/api/coinstats/search', params: (entities) => ({ query: entities.tokens?.[0] }) },
      { api: '/api/coinstats/coins/:coinId', params: (entities) => ({ coinId: entities.tokens?.[0] }) },
      { api: '/api/lurky/coins', params: (entities) => ({ coinSymbol: entities.tokens?.[0] }) },
      { api: '/api/websearch', params: (entities) => ({ query: `${entities.tokens?.[0]} price USD` }) }
    ],
    volume: [
      { api: '/api/coinstats/search', params: (entities) => ({ query: entities.tokens?.[0] }) },
      { api: '/api/coinstats/coins/:coinId', params: (entities, coinId) => ({ coinId: entities.tokens?.[0] }) },
      { api: '/api/okx/popular-pairs', params: () => ({}) },
      { api: '/api/lurky/coins', params: (entities) => ({ coinSymbol: entities.tokens?.[0] }) }
    ],
    marketCap: [
      { api: '/api/coingecko/markets', params: () => ({ per_page: 10, order: 'market_cap_desc' }) },
      { api: '/api/coinstats/search', params: (entities) => ({ query: entities.tokens?.[0] }) },
      { api: '/api/coinstats/coins', params: () => ({ limit: 10, sortBy: 'marketCap' }) },
      { api: '/api/lurky/coins', params: (entities) => ({ coinSymbol: entities.tokens?.[0] }) }
    ],
    trending: [
      // ⭐ BLOCKCHAIN-SPECIFIC (when blockchain mentioned) - Works for ALL chains dynamically
      { api: '/api/coingecko/markets', params: (entities) => ({ 
        category: `${entities.blockchains?.[0]?.toLowerCase()}-ecosystem`,  // ✅ DYNAMIC: ton-ecosystem, solana-ecosystem, ethereum-ecosystem, arbitrum-ecosystem, etc.
        per_page: 50,
        order: 'volume_desc'
      }), condition: (entities) => entities.blockchains?.length > 0 },
      { api: '/api/twitter/search', params: (entities) => ({ 
        query: `${entities.blockchains?.[0]} trending tokens high volume pumping -airdrop -scam` 
      }), condition: (entities) => entities.blockchains?.length > 0 },
      { api: '/api/websearch', params: (entities) => ({ 
        query: `What tokens are trending and pumping on ${entities.blockchains?.[0]} blockchain right now?` 
      }), condition: (entities) => entities.blockchains?.length > 0 },
      
      // ⭐ GENERIC TRENDING (fallback when no blockchain mentioned)
      { api: '/api/coingecko/trending', params: () => ({}) },
      { api: '/api/coinstats/coins', params: () => ({ limit: 10, sortBy: 'volume' }) },
      { api: '/api/lurky/trending', params: () => ({}) },
      { api: '/api/protokols/projects/trending', params: () => ({}) }
    ],
    news: [
      { api: '/api/websearch', params: (entities, address, understanding) => {
        // Extract keywords from reasoning agent's understanding
        const tokens = entities.tokens || [];
        const blockchains = entities.blockchains || [];
        const other = entities.other || [];
        
        // Build search query from entities
        const keywords = [...tokens, ...blockchains, ...other].filter(Boolean);
        const query = keywords.length > 0 
          ? keywords.join(' ') + ' cryptocurrency latest news'
          : understanding?.user_wants || 'crypto news';
          
        return { query };
      }},
      { api: '/api/twitter/search', params: (entities) => ({ 
        query: `${entities.tokens?.[0] || entities.blockchains?.[0] || 'crypto'} news -airdrop` 
      })},
      { api: '/api/protokols/posts/search', params: (entities) => ({ 
        query: entities.tokens?.[0] || entities.blockchains?.[0] 
      })}
    ],
    sentiment: [
      { api: '/api/twitter/search', params: (entities) => ({ 
        query: `$${entities.tokens?.[0] || entities.blockchains?.[0] || 'BTC'} sentiment bullish bearish` 
      })},
      { api: '/api/lurky/coins', params: (entities) => ({ 
        coinSymbol: entities.tokens?.[0], 
        sort_by: 'sentiment' 
      })},
      { api: '/api/protokols/analysis', params: () => ({}) },
      { api: '/api/protokols/narratives', params: () => ({}) }
    ],
    portfolio: [
      { api: '/api/portfolio/:address', params: (entities, address) => ({ address }) },
      { api: '/api/alchemy/token-balances', params: (entities, address) => ({ address }) }
    ],
    swapQuote: [
      { api: '/api/zerox/quote', params: (entities) => ({ 
        sellToken: entities.tokens?.[0], 
        buyToken: entities.tokens?.[1],
        sellAmount: '1000000000000000000' // Default 1 token in wei
      })},
      { api: '/api/okx/quote', params: (entities) => ({
        fromToken: entities.tokens?.[0],
        toToken: entities.tokens?.[1],
        chain: 'eth'
      })},
      { api: '/api/changenow/exchange-amount', params: (entities) => ({
        from: entities.tokens?.[0]?.toLowerCase(),
        to: entities.tokens?.[1]?.toLowerCase(),
        amount: '1'
      })}
    ],
    blockchainData: [
      // ⭐ TOKEN PLATFORM INFO - CoinGecko includes chain/platform details for ANY token
      { api: '/api/coingecko/coins/:coinId', params: (entities) => ({ 
        coinId: entities.tokens?.[0]?.toLowerCase() 
      }), condition: (entities) => entities.tokens?.length > 0 },
      
      // ⭐ CHAIN-AGNOSTIC BLOCKCHAIN DATA - Works for ETH, Polygon, Arbitrum, Optimism via Alchemy
      { api: '/api/chainbase/account/balance/:chainId/:address', params: (entities, address) => ({ 
        chainId: entities.blockchains?.[0]?.toLowerCase(),
        address 
      }), condition: (entities) => entities.blockchains?.length > 0 && address },
      
      // ⭐ WEB SEARCH FALLBACK for any blockchain questions
      { api: '/api/websearch', params: (entities, address, understanding) => ({ 
        query: understanding?.user_wants || `What blockchain is ${entities.tokens?.[0]} on?`
      }) }
    ],
    kols: [
      { api: '/api/protokols/kol/trending', params: () => ({}) },
      { api: '/api/protokols/narratives', params: () => ({}) },
      { api: '/api/twitter/search', params: (entities, address, understanding) => ({ query: `${entities.tokens?.[0] || 'crypto'} influencer` }) }
    ]
  };

  /**
   * Intelligently select which APIs to call
   * @param {object} understanding - Output from Reasoning Agent
   * @param {object} userContext - Additional context (wallet address, etc.)
   * @returns {Array} List of API calls to make
   */
  static selectAPIs(understanding, userContext = {}) {
    console.log('🎯 [API Control Agent] Selecting APIs for:', understanding.user_wants);
    
    const needed = understanding.to_answer_need || [];
    const entities = understanding.entities_mentioned || {};
    const apiCalls = [];
    
    // For each needed data type, select and call APIs
    // NOTE: Cache is still available via userContext - Frontend Agent can use it alongside fresh data
    needed.forEach(dataType => {
      // Always proceed with API selection - don't skip based on cache
      // Cache provides historical context, APIs provide fresh real-time data
      const availableAPIs = this.API_CAPABILITIES[dataType];
      
      if (!availableAPIs) {
        console.log(`⚠️ [API Control Agent] No APIs available for: ${dataType}`);
        return;
      }
      
      // Filter APIs based on conditions
      const applicableAPIs = availableAPIs.filter(api => {
        if (api.condition) {
          return api.condition(entities);
        }
        return true;
      });
      
      // Select the best API (first applicable one, can be made smarter)
      if (applicableAPIs.length > 0) {
        const selectedAPI = applicableAPIs[0];
        
        apiCalls.push({
          dataType,
          endpoint: selectedAPI.api,
          params: selectedAPI.params(entities, userContext.address, understanding), // ⭐ Pass understanding for news/search
          priority: understanding.urgency,
          entities // ⭐ Store entities for Token Resolver Agent
        });
        
        console.log(`📡 [API Control Agent] Will call API for ${dataType}: ${selectedAPI.api}`);
      }
    });
    
    console.log(`🎯 [API Control Agent] Selected ${apiCalls.length} API calls:`, 
      apiCalls.map(call => `${call.dataType} -> ${call.endpoint}`));
    
    return apiCalls;
  }

  /**
   * Execute API calls in parallel with smart caching
   * @param {Array} apiCalls - List of API calls from selectAPIs
   * @param {Function} fetchFunction - Function to make HTTP requests
   * @returns {Promise<object>} Results from all APIs
   */
  static async executeAPIs(apiCalls, fetchFunction) {
    console.log('⚡ [API Control Agent] Executing API calls with cache check...');
    
    const promises = apiCalls.map(async (call) => {
      try {
        // 🧠 STEP 1: Check cache first
        const cacheKey = this.generateCacheKey(call.dataType, call.entities);
        const cachedData = this.getCachedData(cacheKey);
        
        if (cachedData) {
          console.log(`⚡ [API Control Agent] Using cached data for ${call.dataType}`);
          return {
            dataType: call.dataType,
            data: cachedData,
            success: true,
            fromCache: true
          };
        }
        
        // 🆕 STEP 2: Enhance params with Token Resolver Agent (follows exact process: search → get ID → call)
        const enhancedParams = await TokenResolverAgent.enhanceParams(
          call.endpoint, 
          call.params, 
          call.entities
        );
        
        // 🌐 STEP 3: Make the API call with enhanced params
        console.log(`📡 [API Control Agent] Fetching fresh data for ${call.dataType}`);
        const result = await fetchFunction(call.endpoint, enhancedParams);
        
        // 💾 STEP 4: Store in cache
        this.setCachedData(cacheKey, result);
        
        return {
          dataType: call.dataType,
          data: result,
          success: true,
          fromCache: false
        };
      } catch (error) {
        console.error(`❌ [API Control Agent] Failed ${call.endpoint}:`, error.message);
        return {
          dataType: call.dataType,
          error: error.message,
          success: false
        };
      }
    });
    
    const results = await Promise.all(promises);
    
    // Organize results by data type
    const organized = {};
    results.forEach(result => {
      if (result.success) {
        organized[`${result.dataType}Data`] = result.data;
      }
    });
    
    const cacheHits = results.filter(r => r.fromCache).length;
    const freshFetches = results.filter(r => r.success && !r.fromCache).length;
    
    console.log(`✅ [API Control Agent] Completed: ${cacheHits} from cache, ${freshFetches} fresh fetches`);
    console.log(`📊 [API Control Agent] Data available:`, Object.keys(organized));
    
    return organized;
  }
}
