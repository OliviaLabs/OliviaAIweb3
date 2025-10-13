import { TokenResolverAgent } from '../token-resolver/index.js';
import { withResilience } from '../utils/resilience.js';

/**
 * API Control Agent (Refactored to Executor Only)
 * Executes API calls selected by the API Selection Agent
 * Handles caching, token resolution, parallel execution, and resilience
 */
export class APIControlAgent {
  
  // 🧠 Cache storage for API responses
  static cache = new Map();
  static CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Generate cache key based on call details (dataType, endpoint, params, entities)
   * This creates a unique, collision-resistant cache key
   */
  static generateCacheKey(call) {
    // Base key: dataType + endpoint + params
    const base = [
      call.dataType || 'unknown',
      call.endpoint || '',
      JSON.stringify(call.params || {})
    ].join('|');

    // Entity signature (optional, but makes key more specific)
    const entities = call.entities || {};
    const entitySignature = JSON.stringify({
      t: (entities.tokens || []).sort(),
      b: (entities.blockchains || []).sort(),
      o: (entities.other || []).sort()
    });

    const fullKey = entitySignature ? `${base}|${entitySignature}` : base;
    
    // Hash long keys to keep them manageable
    if (fullKey.length > 200) {
      // Simple hash for logging purposes
      let hash = 0;
      for (let i = 0; i < fullKey.length; i++) {
        const char = fullKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return `${call.dataType}_${Math.abs(hash).toString(16)}`;
    }

    return fullKey;
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
   * Execute API calls in parallel with smart caching and token resolution
   * @param {Array} apiCalls - List of API calls from API Selection Agent
   * @param {Function} fetchFunction - Function to make HTTP requests
   * @returns {Promise<object>} Results from all APIs
   */
  static async executeAPIs(apiCalls, fetchFunction) {
    console.log('⚡ [API Control Agent] Executing API calls with cache check...');
    
    const promises = apiCalls.map(async (call) => {
      try {
        // 🧠 STEP 1: Check cache first with new collision-resistant key
        const cacheKey = this.generateCacheKey(call);
        const cachedData = this.getCachedData(cacheKey);
        
        if (cachedData) {
          console.log(`⚡ [API Control Agent] Cache hit: ${call.dataType} (key: ${cacheKey.slice(0, 50)}...)`);
          return {
            dataType: call.dataType,
            data: cachedData,
            success: true,
            fromCache: true
          };
        }
        
        // 🆕 STEP 2: Enhance params with Token Resolver Agent
        const enhancedParams = await TokenResolverAgent.enhanceParams(
          call.endpoint, 
          call.params, 
          call.entities || {}
        );
        
        // 🌐 STEP 3: Make the API call with enhanced params + resilience
        console.log(`📡 [API Control Agent] Fetching: ${call.dataType} from ${call.endpoint}`);
        
        const result = await withResilience(
          () => fetchFunction(call.endpoint, enhancedParams),
          call.endpoint,
          {
            timeoutMs: 5000,
            maxRetries: 2,
            useCircuitBreaker: true
          }
        );
        
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
  
  /**
   * DEPRECATED: API selection now handled by API Selection Agent
   * This method is kept for backward compatibility but should not be used
   */
  static selectAPIs(understanding, userContext = {}) {
    console.warn('⚠️ [API Control Agent] selectAPIs() is deprecated! Use API Selection Agent instead.');
    return [];
  }
}

