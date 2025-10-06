class DataRouterService {
  
  // 🎯 NO HARDCODED LISTS - Generate category dynamically
  // If CoinGecko has it, it works. If not, other APIs provide data.
  constructor() {
    // Special cases only (where CoinGecko uses different naming)
    this.categoryOverrides = {
      'BNB': 'binance-smart-chain',
      'BSC': 'binance-smart-chain',
      'TON': 'ton-ecosystem',  // ✅ FIXED: was 'the-open-network-ecosystem'
      'HEDERA': 'hedera-hashgraph-ecosystem',
      'MANTA': 'manta-network-ecosystem'
    };
  }
  
  getCoinGeckoCategory(blockchain) {
    // Check override first
    const override = this.categoryOverrides[blockchain.toUpperCase()];
    if (override) return override;
    
    // Otherwise, generate dynamically
    return `${blockchain.toLowerCase()}-ecosystem`;
  }
  
  route(intent) {
    console.log('🗺️ [Data Router] Routing for intent:', intent.intent_type);
    
    const calls = [];
    
    switch(intent.intent_type) {
      
      case 'trending_ecosystem':
        calls.push(...this.routeTrendingEcosystem(intent));
        break;
        
      case 'specific_token':
      case 'causal_analysis':
        calls.push(...this.routeSpecificToken(intent));
        break;
        
      case 'comparison':
        calls.push(...this.routeComparison(intent));
        break;
        
      case 'portfolio':
        calls.push(...this.routePortfolio(intent));
        break;
        
      case 'follow_up':
        if (intent.context.references_previous_token) {
          intent.target.tokens = [intent.context.references_previous_token];
          calls.push(...this.routeSpecificToken(intent));
        }
        break;
        
      default:
        console.log('⚠️ [Data Router] Unknown intent, using general approach');
        calls.push(...this.routeGeneral(intent));
    }
    
    console.log(`📊 [Data Router] Planned ${calls.length} API calls`);
    
    return {
      api_calls: calls,
      execution_strategy: 'parallel',
      max_wait: 3000,
      fallback: 'proceed_with_partial_data'
    };
  }
  
  routeTrendingEcosystem(intent) {
    const blockchain = intent.target.blockchain;
    const calls = [];
    
    console.log(`🌐 [Data Router] 🔥 GREEDY MODE - Calling ALL relevant APIs`);
    console.log(`   Target: ${blockchain} ecosystem`);
    
    if (!blockchain) {
      console.log(`   ⚠️ No blockchain specified, using general trending only`);
      calls.push({ service: 'coingecko', method: 'getTrending', params: {}, priority: 'high', timeout: 2000 });
      return calls;
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 PRICE & MARKET DATA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // CoinGecko - ecosystem category
    const category = this.getCoinGeckoCategory(blockchain);
    calls.push({
      service: 'coingecko',
      method: 'getCategoryMarkets',
      params: { category, limit: 20 },
      priority: 'high',
      timeout: 3000
    });
    
    // CoinGecko - search blockchain name
    calls.push({
      service: 'coingecko',
      method: 'searchAndGetPrice',
      params: { query: blockchain },
      priority: 'medium',
      timeout: 2000
    });
    
    // CoinGecko - general trending (context)
    calls.push({
      service: 'coingecko',
      method: 'getTrending',
      params: {},
      priority: 'low',
      timeout: 2000
    });
    
    // CoinStats - search
    calls.push({
      service: 'coinstats',
      method: 'search',
      params: { query: blockchain },
      priority: 'medium',
      timeout: 2000
    });
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🐦 SOCIAL SENTIMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // Twitter - ecosystem trending
    calls.push({
      service: 'twitter',
      method: 'search',
      params: { 
        query: `${blockchain} ecosystem trending tokens -airdrop -giveaway`,
        limit: 20
      },
      priority: 'high',
      timeout: 2000
    });
    
    // Twitter - pumping/hot
    calls.push({
      service: 'twitter',
      method: 'search',
      params: { 
        query: `${blockchain} pumping hot -airdrop`,
        limit: 20
      },
      priority: 'medium',
      timeout: 2000
    });
    
    // Lurky - sentiment
    calls.push({
      service: 'lurky',
      method: 'getCoins',
      params: { search: blockchain, limit: 10 },
      priority: 'medium',
      timeout: 2000
    });
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📰 NEWS & CATALYSTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // CryptoPanic - hot news
    calls.push({
      service: 'cryptopanic',
      method: 'getNews',
      params: { 
        filter: 'hot',
        currencies: blockchain.toUpperCase()
      },
      priority: 'high',
      timeout: 2000
    });
    
    // CryptoPanic - recent news
    calls.push({
      service: 'cryptopanic',
      method: 'getNews',
      params: { 
        currencies: blockchain.toUpperCase(),
        public: 'true'
      },
      priority: 'medium',
      timeout: 2000
    });
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔗 CHAIN-SPECIFIC APIs
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    if (blockchain.toUpperCase() === 'TON') {
      calls.push({
        service: 'ton_center',
        method: 'getPopularJettons',
        params: {},
        priority: 'high',
        timeout: 2000
      });
    }
    
    // Add more chain-specific APIs as we integrate them:
    // - Hedera for HBAR
    // - Solana RPC for SOL
    // - etc.
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💱 DEX & SWAP DATA (try even if might not work)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // OKX - try to get market data
    calls.push({
      service: 'okx',
      method: 'getMarketData',
      params: { symbol: blockchain },
      priority: 'low',
      timeout: 2000
    });
    
    // ChangeNow - available pairs
    calls.push({
      service: 'changenow',
      method: 'getAvailablePairs',
      params: { currency: blockchain.toLowerCase() },
      priority: 'low',
      timeout: 2000
    });
    
    // 0x - try for swap data (may not work for all chains)
    calls.push({
      service: '0x',
      method: 'getTokens',
      params: { chain: blockchain.toLowerCase() },
      priority: 'low',
      timeout: 2000
    });
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎮 SPECIALIZED DATA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // Protokols - gaming/social mentions
    calls.push({
      service: 'protokols',
      method: 'search',
      params: { keyword: blockchain },
      priority: 'low',
      timeout: 2000
    });
    
    // Alchemy/Chainbase - on-chain activity (if blockchain supported)
    calls.push({
      service: 'alchemy',
      method: 'getChainActivity',
      params: { blockchain: blockchain.toLowerCase() },
      priority: 'low',
      timeout: 2000
    });
    
    console.log(`   🔥 Queued ${calls.length} parallel API calls`);
    console.log(`   ⏱️ Max wait: 3 seconds for all to complete`);
    
    return calls;
  }
  
  routeSpecificToken(intent) {
    const tokens = intent.target.tokens || [];
    const calls = [];
    
    console.log(`🎯 [Data Router] Routing for tokens:`, tokens);
    
    tokens.forEach(tokenSymbol => {
      
      if (intent.data_requirements.price_data !== false) {
        calls.push({
          service: 'coingecko',
          method: 'searchAndGetPrice',
          params: { query: tokenSymbol },
          priority: 'high',
          timeout: 2000,
          token: tokenSymbol
        });
      }
      
      if (intent.data_requirements.social_sentiment) {
        calls.push({
          service: 'twitter',
          method: 'search',
          params: { 
            query: `$${tokenSymbol.toUpperCase()} price -telegram -airdrop`,
            limit: 20
          },
          priority: 'high',
          timeout: 2000,
          token: tokenSymbol
        });
      }
      
      if (intent.data_requirements.news_catalyst) {
        calls.push({
          service: 'cryptopanic',
          method: 'getNews',
          params: { 
            currencies: tokenSymbol.toUpperCase(),
            public: 'true'
          },
          priority: 'high',
          timeout: 2000,
          token: tokenSymbol
        });
      }
    });
    
    return calls;
  }
  
  routeComparison(intent) {
    return this.routeSpecificToken({
      ...intent,
      data_requirements: {
        price_data: true,
        social_sentiment: true
      }
    });
  }
  
  routePortfolio(intent) {
    return [{
      service: 'alchemy',
      method: 'getTokenBalances',
      params: { address: intent.wallet_address },
      priority: 'high',
      timeout: 3000
    }];
  }
  
  routeGeneral(intent) {
    return [{
      service: 'coingecko',
      method: 'getTrending',
      params: {},
      priority: 'high',
      timeout: 2000
    }];
  }
  
  async execute(routingPlan) {
    const { api_calls, max_wait } = routingPlan;
    
    console.log(`🚀 [Data Router] Executing ${api_calls.length} API calls...`);
    
    const startTime = Date.now();
    
    try {
      const results = await Promise.race([
        Promise.allSettled(
          api_calls.map(call => this.executeCall(call))
        ),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), max_wait)
        )
      ]);
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ [Data Router] Completed in ${elapsed}ms`);
      
      const organized = this.organizeResults(results, api_calls);
      
      return organized;
      
    } catch (error) {
      console.log(`⏱️ [Data Router] Timeout at ${max_wait}ms, returning partial data`);
      return { by_service: {}, by_token: {}, summary: { total: 0, successful: 0, failed: 0 } };
    }
  }
  
  async executeCall(call) {
    const { service, method, params, timeout, token } = call;
    
    console.log(`  📡 [${service}] ${method}(${JSON.stringify(params)})`);
    
    try {
      const result = await Promise.race([
        this.callService(service, method, params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Call timeout')), timeout)
        )
      ]);
      
      return { service, method, token, data: result, success: true };
      
    } catch (error) {
      console.log(`  ❌ [${service}] ${method} failed:`, error.message);
      return { service, method, token, error: error.message, success: false };
    }
  }
  
  async callService(service, method, params) {
    switch(service) {
      case 'coingecko':
        return await this.callCoinGecko(method, params);
      
      case 'twitter':
        return await this.callTwitter(method, params);
      
      case 'ton_center':
        return await this.callTonCenter(method, params);
      
      case 'cryptopanic':
        return await this.callCryptoPanic(method, params);
      
      case 'coinstats':
        return await this.callCoinStats(method, params);
      
      case 'lurky':
        return await this.callLurky(method, params);
      
      case 'okx':
        return await this.callOKX(method, params);
      
      case 'changenow':
        return await this.callChangeNow(method, params);
      
      case '0x':
        return await this.call0x(method, params);
      
      case 'protokols':
        return await this.callProtokols(method, params);
      
      case 'alchemy':
        return await this.callAlchemy(method, params);
      
      case 'chainbase':
        return await this.callChainbase(method, params);
      
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }
  
  async callCoinGecko(method, params) {
    const baseUrl = 'https://api.coingecko.com/api/v3';
    
    switch(method) {
      case 'getTrending':
        const res1 = await fetch(`${baseUrl}/search/trending`);
        return await res1.json();
      
      case 'getCategoryMarkets':
        // 🎯 NEW: Fetch tokens from specific blockchain category
        const { category, limit = 20 } = params;
        console.log(`   📡 CoinGecko: Fetching ${limit} tokens from category "${category}"`);
        
        const categoryUrl = `${baseUrl}/coins/markets?vs_currency=usd&category=${category}&order=volume_desc&per_page=${limit}&sparkline=false&price_change_percentage=24h`;
        const categoryRes = await fetch(categoryUrl);
        const categoryData = await categoryRes.json();
        
        console.log(`   ✅ CoinGecko: Retrieved ${categoryData.length} tokens from ${category}`);
        return categoryData;
      
      case 'searchAndGetPrice':
        const searchRes = await fetch(`${baseUrl}/search?query=${params.query}`);
        const searchData = await searchRes.json();
        if (searchData.coins && searchData.coins[0]) {
          const coinId = searchData.coins[0].id;
          const priceRes = await fetch(`${baseUrl}/coins/${coinId}`);
          return await priceRes.json();
        }
        return null;
      
      default:
        throw new Error(`Unknown CoinGecko method: ${method}`);
    }
  }
  
  async callTwitter(method, params) {
    // Use existing Twitter API from microservice
    const res = await fetch(`http://localhost:3000/api/twitter/search?query=${encodeURIComponent(params.query)}&limit=${params.limit}`);
    return await res.json();
  }
  
  async callTonCenter(method, params) {
    // Use existing TON Center API
    const res = await fetch(`http://localhost:3000/api/ton/popular-jettons`);
    return await res.json();
  }
  
  async callCryptoPanic(method, params) {
    const apiKey = '8f21a7808b68dd6807a62bcd1e53db4e467b660f';
    const baseUrl = 'https://cryptopanic.com/api/developer/v2';
    
    if (method === 'getNews') {
      const url = `${baseUrl}/posts/?auth_token=${apiKey}&currencies=${params.currencies}&public=${params.public}`;
      const res = await fetch(url);
      return await res.json();
    }
    
    throw new Error(`Unknown CryptoPanic method: ${method}`);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔌 MICROSERVICE PROXY METHODS
  // Call our own microservice routes to reuse existing integrations
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  async callCoinStats(method, params) {
    const baseUrl = 'http://localhost:3000/api/coinstats';
    
    if (method === 'search') {
      const res = await fetch(`${baseUrl}/search?query=${encodeURIComponent(params.query)}`);
      const data = await res.json();
      return data.success ? data.data : [];
    }
    
    throw new Error(`Unknown CoinStats method: ${method}`);
  }
  
  async callLurky(method, params) {
    const baseUrl = 'http://localhost:3000/api/lurky';
    
    if (method === 'getCoins') {
      const queryParams = new URLSearchParams({
        search: params.search || '',
        limit: params.limit || 10
      });
      const res = await fetch(`${baseUrl}/coins?${queryParams}`);
      const data = await res.json();
      return data.success ? data.data : [];
    }
    
    throw new Error(`Unknown Lurky method: ${method}`);
  }
  
  async callOKX(method, params) {
    const baseUrl = 'http://localhost:3000/api/okx';
    
    if (method === 'getMarketData') {
      const res = await fetch(`${baseUrl}/market-data?symbol=${encodeURIComponent(params.symbol)}`);
      const data = await res.json();
      return data.success ? data.data : null;
    }
    
    throw new Error(`Unknown OKX method: ${method}`);
  }
  
  async callChangeNow(method, params) {
    const baseUrl = 'http://localhost:3000/api/changenow';
    
    if (method === 'getAvailablePairs') {
      const res = await fetch(`${baseUrl}/pairs?currency=${params.currency}`);
      const data = await res.json();
      return data.success ? data.data : [];
    }
    
    throw new Error(`Unknown ChangeNow method: ${method}`);
  }
  
  async call0x(method, params) {
    const baseUrl = 'http://localhost:3000/api/zerox';
    
    if (method === 'getTokens') {
      const res = await fetch(`${baseUrl}/tokens?chain=${params.chain}`);
      const data = await res.json();
      return data.success ? data.data : [];
    }
    
    throw new Error(`Unknown 0x method: ${method}`);
  }
  
  async callProtokols(method, params) {
    const baseUrl = 'http://localhost:3000/api/protokols';
    
    if (method === 'search') {
      const res = await fetch(`${baseUrl}/search?keyword=${encodeURIComponent(params.keyword)}`);
      const data = await res.json();
      return data.success ? data.data : [];
    }
    
    throw new Error(`Unknown Protokols method: ${method}`);
  }
  
  async callAlchemy(method, params) {
    const baseUrl = 'http://localhost:3000/api/alchemy';
    
    if (method === 'getChainActivity') {
      const res = await fetch(`${baseUrl}/chain-activity?blockchain=${params.blockchain}`);
      const data = await res.json();
      return data.success ? data.data : null;
    }
    
    throw new Error(`Unknown Alchemy method: ${method}`);
  }
  
  async callChainbase(method, params) {
    const baseUrl = 'http://localhost:3000/api/chainbase';
    
    if (method === 'getChainData') {
      const res = await fetch(`${baseUrl}/chain-data?blockchain=${params.blockchain}`);
      const data = await res.json();
      return data.success ? data.data : null;
    }
    
    throw new Error(`Unknown Chainbase method: ${method}`);
  }
  
  organizeResults(results, apiCalls) {
    const organized = {
      by_service: {},
      by_token: {},
      summary: {
        total: results.length,
        successful: 0,
        failed: 0
      }
    };
    
    results.forEach((result, idx) => {
      const call = apiCalls[idx];
      
      if (result.status === 'fulfilled' && result.value.success) {
        organized.summary.successful++;
        
        if (!organized.by_service[result.value.service]) {
          organized.by_service[result.value.service] = [];
        }
        organized.by_service[result.value.service].push(result.value.data);
        
        if (result.value.token) {
          if (!organized.by_token[result.value.token]) {
            organized.by_token[result.value.token] = {};
          }
          organized.by_token[result.value.token][result.value.service] = result.value.data;
        }
      } else {
        organized.summary.failed++;
      }
    });
    
    console.log(`📊 [Data Router] Results: ${organized.summary.successful}/${organized.summary.total} successful`);
    
    return organized;
  }
}

export default new DataRouterService();
