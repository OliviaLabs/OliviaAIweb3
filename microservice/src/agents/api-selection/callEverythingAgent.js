/**
 * Call Everything Agent
 * Simple approach: Call ALL available APIs for maximum data coverage
 * No AI selection - just call everything and let the Reasoning Agent analyze
 */

export class CallEverythingAgent {
  
  /**
   * Call ALL available APIs for a token
   * @param {object} understanding - Output from Reasoning Agent
   * @param {object} userContext - User context (wallet, etc.)
   * @returns {Promise<Array>} List of ALL possible API calls
   */
  static async callEverything(understanding, userContext = {}) {
    console.log('🚀 [Call Everything Agent] Calling ALL APIs for maximum data coverage...');
    
    const entities = understanding.entities_mentioned || {};
    const tokens = entities.tokens || [];
    const blockchains = entities.blockchains || [];
    
    // Enrich entities for downstream use
    const enrichedEntities = {
      tokens: tokens || [],
      blockchains: blockchains || [],
      other: entities.other || []
    };
    
    if (tokens.length === 0) {
      console.log('⚠️ [Call Everything Agent] No tokens detected, calling general APIs');
      return this.getGeneralAPIs(enrichedEntities);
    }
    
    const token = tokens[0].toLowerCase();
    const tokenUpper = tokens[0].toUpperCase();
    
    console.log(`🎯 [Call Everything Agent] Calling ALL APIs for token: ${token}`, {
      entities: enrichedEntities
    });
    
    // Build comprehensive list of ALL possible API calls
    const allAPICalls = [];
    
    // ========== COINGECKO APIs ==========
    allAPICalls.push(
      {
        dataType: 'price',
        endpoint: '/api/coingecko/prices',
        params: { ids: token },
        description: 'CoinGecko prices',
        priority: 'high'
      },
      {
        dataType: 'price',
        endpoint: '/api/coingecko/coins',
        params: { id: token },
        description: 'CoinGecko detailed coin info',
        priority: 'high'
      },
      {
        dataType: 'trending',
        endpoint: '/api/coingecko/trending',
        params: {},
        description: 'CoinGecko trending coins',
        priority: 'medium'
      },
      {
        dataType: 'marketCap',
        endpoint: '/api/coingecko/markets',
        params: { per_page: 50, order: 'market_cap_desc' },
        description: 'CoinGecko market data',
        priority: 'medium'
      }
    );
    
    // ========== BINANCE APIs ==========
    allAPICalls.push(
      {
        dataType: 'price',
        endpoint: '/api/binance/price',
        params: { symbol: `${tokenUpper}USDT` },
        description: 'Binance price',
        priority: 'high'
      },
      {
        dataType: 'price',
        endpoint: '/api/binance/ticker',
        params: { symbol: `${tokenUpper}USDT` },
        description: 'Binance 24h ticker',
        priority: 'high'
      }
    );
    
    // ========== LURKY APIs ==========
    allAPICalls.push(
      {
        dataType: 'sentiment',
        endpoint: '/api/lurky/coins',
        params: { coinSymbol: token },
        description: 'Lurky sentiment data',
        priority: 'medium'
      },
      {
        dataType: 'trending',
        endpoint: '/api/lurky/trending',
        params: {},
        description: 'Lurky trending coins',
        priority: 'medium'
      }
    );
    
    // ========== TWITTER APIs ==========
    allAPICalls.push(
      {
        dataType: 'sentiment',
        endpoint: '/api/twitter/mentions',
        params: { query: token },
        description: 'Twitter mentions',
        priority: 'medium'
      },
      {
        dataType: 'news',
        endpoint: '/api/twitter/news',
        params: { query: token },
        description: 'Twitter news',
        priority: 'medium'
      }
    );
    
    // ========== COINSTATS APIs ==========
    allAPICalls.push(
      {
        dataType: 'price',
        endpoint: '/api/coinstats/search',
        params: { query: token },
        description: 'CoinStats search',
        priority: 'medium'
      },
      {
        dataType: 'price',
        endpoint: '/api/coinstats/coins',
        params: { limit: 50 },
        description: 'CoinStats coins',
        priority: 'low'
      }
    );
    
    // ========== OKX APIs ==========
    allAPICalls.push(
      {
        dataType: 'swapQuote',
        endpoint: '/api/okx/quote',
        params: { 
          fromToken: tokenUpper,
          toToken: 'USDT',
          amount: '1'
        },
        description: 'OKX swap quote',
        priority: 'medium'
      },
      {
        dataType: 'price',
        endpoint: '/api/okx/token-holders-query',
        params: { 
          token: tokenUpper,
          limit: 10
        },
        description: 'OKX token holders',
        priority: 'low'
      }
    );
    
    // ========== TON APIs ==========
    if (blockchains.includes('TON') || blockchains.includes('ton')) {
      allAPICalls.push(
        {
          dataType: 'blockchainData',
          endpoint: '/api/ton/popular-jettons',
          params: {},
          description: 'TON popular jettons',
          priority: 'medium'
        }
      );
    }
    
    // ========== ZEROX APIs ==========
    allAPICalls.push(
      {
        dataType: 'swapQuote',
        endpoint: '/api/zerox/price',
        params: {
          chainId: 1,
          sellToken: '0x0000000000000000000000000000000000000000', // ETH
          buyToken: '0xA0b86a33E6441b8C4C8C0d4B0c8B0c8B0c8B0c8B', // USDT placeholder
          sellAmount: '1000000000000000000' // 1 ETH
        },
        description: '0x swap price',
        priority: 'low'
      }
    );
    
    // ========== GENERAL APIs (always call) ==========
    allAPICalls.push(
      {
        dataType: 'trending',
        endpoint: '/api/coingecko/trending',
        params: {},
        description: 'General trending data',
        priority: 'high'
      },
      {
        dataType: 'news',
        endpoint: '/api/openai/websearch',
        params: { query: `cryptocurrency ${token} news` },
        description: 'Web search news',
        priority: 'medium'
      }
    );
    
    console.log(`🚀 [Call Everything Agent] Generated ${allAPICalls.length} API calls`);
    console.log('📊 [Call Everything Agent] API breakdown:', {
      price: allAPICalls.filter(c => c.dataType === 'price').length,
      trending: allAPICalls.filter(c => c.dataType === 'trending').length,
      sentiment: allAPICalls.filter(c => c.dataType === 'sentiment').length,
      news: allAPICalls.filter(c => c.dataType === 'news').length,
      marketCap: allAPICalls.filter(c => c.dataType === 'marketCap').length,
      swapQuote: allAPICalls.filter(c => c.dataType === 'swapQuote').length,
      blockchainData: allAPICalls.filter(c => c.dataType === 'blockchainData').length
    });
    
    // Attach entities to every API call for proper caching and resolution
    return allAPICalls.map(call => ({
      ...call,
      entities: enrichedEntities
    }));
  }
  
  /**
   * Get general APIs when no specific token is detected
   * @param {object} enrichedEntities - Entities object to attach to calls
   */
  static getGeneralAPIs(enrichedEntities = { tokens: [], blockchains: [], other: [] }) {
    const generalAPIs = [
      {
        dataType: 'trending',
        endpoint: '/api/coingecko/trending',
        params: {},
        description: 'General trending data',
        priority: 'high'
      },
      {
        dataType: 'marketCap',
        endpoint: '/api/coingecko/markets',
        params: { per_page: 20, order: 'market_cap_desc' },
        description: 'Top market cap coins',
        priority: 'high'
      },
      {
        dataType: 'trending',
        endpoint: '/api/lurky/trending',
        params: {},
        description: 'Lurky trending',
        priority: 'medium'
      },
      {
        dataType: 'news',
        endpoint: '/api/openai/websearch',
        params: { query: 'cryptocurrency news today' },
        description: 'General crypto news',
        priority: 'medium'
      }
    ];
    
    // Attach entities to every general API call
    return generalAPIs.map(call => ({
      ...call,
      entities: enrichedEntities
    }));
  }
}
