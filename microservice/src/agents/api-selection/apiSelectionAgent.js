import OpenAI from 'openai';
import { config } from '../../config/config.js';

// Configure OpenAI client for Azure or standard OpenAI
const openai = config.azureOpenAIKey
  ? new OpenAI({
      apiKey: config.azureOpenAIKey,
      baseURL: `${config.azureOpenAIEndpoint}openai/deployments/${config.azureOpenAIDeployment}`,
      defaultQuery: { 'api-version': config.azureOpenAIVersion },
      defaultHeaders: { 'api-key': config.azureOpenAIKey },
    })
  : new OpenAI({ apiKey: config.openaiApiKey });

/**
 * API Selection Agent (NEW!)
 * Intelligently selects the BEST combination of APIs using AI
 * This replaces the hardcoded selectAPIs logic in the old API Control Agent
 */
export class APISelectionAgent {
  
  /**
   * Complete API catalog with all available plugins and endpoints
   */
  static API_CATALOG = {
    // ========== PRICE DATA SOURCES ==========
    price: [
      {
        name: 'CoinGecko Prices',
        endpoint: '/api/coingecko/prices',
        params: (entities) => ({ ids: entities.tokens?.[0] }),
        description: 'General cryptocurrency prices with market cap data',
        strength: 'Comprehensive, accurate, includes historical context',
        bestFor: 'General price queries, market cap comparisons'
      },
      {
        name: 'Binance Price',
        endpoint: '/api/binance/price',
        params: (entities) => ({ symbol: `${entities.tokens?.[0]}USDT` }),
        description: 'Real-time Binance exchange prices',
        strength: 'Real-time, high-frequency, trading-focused',
        bestFor: 'Live trading prices, precise current values'
      },
      {
        name: 'Binance 24h Ticker',
        endpoint: '/api/binance/ticker',
        params: (entities) => ({ symbol: `${entities.tokens?.[0]}USDT` }),
        description: '24-hour price statistics from Binance',
        strength: 'Includes volume, high/low, price changes',
        bestFor: 'Price movement analysis, trading context'
      },
      {
        name: 'CoinStats Search',
        endpoint: '/api/coinstats/search',
        params: (entities) => ({ query: entities.tokens?.[0] }),
        description: 'CoinStats market data',
        strength: 'Alternative data source for verification',
        bestFor: 'Cross-verification, additional context'
      },
      {
        name: 'Lurky Price Data',
        endpoint: '/api/lurky/coins',
        params: (entities) => ({ coinSymbol: entities.tokens?.[0] }),
        description: 'Lurky community-driven price data',
        strength: 'Community sentiment, social metrics',
        bestFor: 'Social context, community perception'
      }
    ],
    
    // ========== TRENDING/POPULAR DATA ==========
    trending: [
      {
        name: 'CoinGecko Trending',
        endpoint: '/api/coingecko/trending',
        params: () => ({}),
        description: 'Top trending cryptocurrencies globally',
        strength: 'Industry-standard trending algorithm',
        bestFor: 'General market trends'
      },
      {
        name: 'CoinGecko Blockchain Ecosystem',
        endpoint: '/api/coingecko/markets',
        params: (entities) => ({ 
          category: `${entities.blockchains?.[0]?.toLowerCase()}-ecosystem`,
          per_page: 50,
          order: 'volume_desc'
        }),
        condition: (entities) => entities.blockchains?.length > 0,
        description: 'Trending tokens on specific blockchain',
        strength: 'Blockchain-specific insights, volume-based',
        bestFor: 'Chain-specific trending queries'
      },
      {
        name: 'Twitter Trending Search',
        endpoint: '/api/twitter/search',
        params: (entities) => ({ 
          query: `${entities.blockchains?.[0] || 'crypto'} trending tokens high volume pumping -airdrop -scam`
        }),
        description: 'Social media trending data',
        strength: 'Real-time social sentiment, viral tokens',
        bestFor: 'Social buzz, emerging trends'
      },
      {
        name: 'Lurky Trending',
        endpoint: '/api/lurky/trending',
        params: () => ({}),
        description: 'Community trending tokens',
        strength: 'Whale activity, smart money insights',
        bestFor: 'Institutional/whale interest'
      },
      {
        name: 'Protokols Trending Projects',
        endpoint: '/api/protokols/projects/trending',
        params: () => ({}),
        description: 'KOL-endorsed trending projects',
        strength: 'Influencer opinions, credibility signals',
        bestFor: 'Influencer-driven trends'
      }
    ],
    
    // ========== NEWS & SENTIMENT ==========
    news: [
      {
        name: 'Web Search',
        endpoint: '/api/websearch',
        params: (entities, address, understanding) => {
          const keywords = [
            ...(entities.tokens || []),
            ...(entities.blockchains || []),
            ...(entities.other || [])
          ].filter(Boolean);
          const query = keywords.length > 0 
            ? keywords.join(' ') + ' cryptocurrency latest news'
            : understanding?.user_wants || 'crypto news';
          return { query };
        },
        description: 'Latest web news and updates',
        strength: 'Real-time, comprehensive coverage',
        bestFor: 'Breaking news, latest developments'
      },
      {
        name: 'Twitter Search',
        endpoint: '/api/twitter/search',
        params: (entities) => ({ 
          query: `${entities.tokens?.[0] || entities.blockchains?.[0] || 'crypto'} news -airdrop`
        }),
        description: 'Social media news and discussions',
        strength: 'Real-time updates, community reactions',
        bestFor: 'Social sentiment, immediate reactions'
      },
      {
        name: 'Protokols Posts',
        endpoint: '/api/protokols/posts/search',
        params: (entities) => ({ 
          query: entities.tokens?.[0] || entities.blockchains?.[0]
        }),
        description: 'KOL opinions and analysis',
        strength: 'Expert insights, credible sources',
        bestFor: 'Expert opinions, analysis'
      }
    ],
    
    // ========== SENTIMENT ANALYSIS ==========
    sentiment: [
      {
        name: 'Twitter Sentiment',
        endpoint: '/api/twitter/search',
        params: (entities) => ({ 
          query: `$${entities.tokens?.[0] || entities.blockchains?.[0] || 'BTC'} sentiment bullish bearish`
        }),
        description: 'Social media sentiment analysis',
        strength: 'Real-time community sentiment',
        bestFor: 'Community mood, public opinion'
      },
      {
        name: 'Lurky Sentiment',
        endpoint: '/api/lurky/coins',
        params: (entities) => ({ 
          coinSymbol: entities.tokens?.[0],
          sort_by: 'sentiment'
        }),
        description: 'Whale and smart money sentiment',
        strength: 'Institutional signals, whale activity',
        bestFor: 'Professional trader sentiment'
      },
      {
        name: 'Protokols Analysis',
        endpoint: '/api/protokols/analysis',
        params: () => ({}),
        description: 'Market analysis from KOLs',
        strength: 'Expert analysis, thought leadership',
        bestFor: 'Professional perspectives'
      },
      {
        name: 'Protokols Narratives',
        endpoint: '/api/protokols/narratives',
        params: () => ({}),
        description: 'Market narratives and themes',
        strength: 'Macro trends, thematic analysis',
        bestFor: 'Understanding market themes'
      }
    ],
    
    // ========== BLOCKCHAIN DATA ==========
    blockchainData: [
      {
        name: 'CoinGecko Token Details',
        endpoint: '/api/coingecko/coins/:coinId',
        params: (entities) => ({ coinId: entities.tokens?.[0]?.toLowerCase() }),
        condition: (entities) => entities.tokens?.length > 0,
        description: 'Detailed token platform information',
        strength: 'Complete blockchain/contract data',
        bestFor: 'Token platform identification'
      },
      {
        name: 'Chainbase Account Balance',
        endpoint: '/api/chainbase/account/balance/:chainId/:address',
        params: (entities, address) => ({ 
          chainId: entities.blockchains?.[0]?.toLowerCase(),
          address
        }),
        condition: (entities, address) => entities.blockchains?.length > 0 && address,
        description: 'On-chain balance data',
        strength: 'Multi-chain support, real balances',
        bestFor: 'Wallet balance queries'
      },
      {
        name: 'Web Search Blockchain Info',
        endpoint: '/api/websearch',
        params: (entities, address, understanding) => ({ 
          query: understanding?.user_wants || `What blockchain is ${entities.tokens?.[0]} on?`
        }),
        description: 'General blockchain information',
        strength: 'Flexible, comprehensive answers',
        bestFor: 'General blockchain questions'
      }
    ],
    
    // ========== KOLS & INFLUENCERS ==========
    kols: [
      {
        name: 'Protokols Trending KOLs',
        endpoint: '/api/protokols/kol/trending',
        params: () => ({}),
        description: 'Trending key opinion leaders',
        strength: 'Influencer tracking, credibility scores',
        bestFor: 'Finding influential voices'
      },
      {
        name: 'Protokols Narratives',
        endpoint: '/api/protokols/narratives',
        params: () => ({}),
        description: 'KOL-driven market narratives',
        strength: 'Thematic analysis from experts',
        bestFor: 'Understanding expert consensus'
      },
      {
        name: 'Twitter Influencer Search',
        endpoint: '/api/twitter/search',
        params: (entities, address, understanding) => ({ 
          query: `${entities.tokens?.[0] || 'crypto'} influencer`
        }),
        description: 'Social media influencer content',
        strength: 'Real-time influencer activity',
        bestFor: 'Current influencer opinions'
      }
    ],
    
    // ========== VOLUME & MARKET DATA ==========
    volume: [
      {
        name: 'CoinStats Coins',
        endpoint: '/api/coinstats/coins/:coinId',
        params: (entities) => ({ coinId: entities.tokens?.[0] }),
        description: 'Trading volume data',
        strength: 'Detailed volume metrics',
        bestFor: 'Volume analysis'
      },
      {
        name: 'OKX Popular Pairs',
        endpoint: '/api/okx/popular-pairs',
        params: () => ({}),
        description: 'High-volume trading pairs',
        strength: 'Exchange-specific volume',
        bestFor: 'Trading pair popularity'
      },
      {
        name: 'Lurky Volume Data',
        endpoint: '/api/lurky/coins',
        params: (entities) => ({ coinSymbol: entities.tokens?.[0] }),
        description: 'Volume with whale activity',
        strength: 'Smart money volume tracking',
        bestFor: 'Institutional volume insights'
      }
    ],
    
    // ========== MARKET CAP ==========
    marketCap: [
      {
        name: 'CoinGecko Markets',
        endpoint: '/api/coingecko/markets',
        params: () => ({ per_page: 10, order: 'market_cap_desc' }),
        description: 'Top cryptocurrencies by market cap',
        strength: 'Industry-standard rankings',
        bestFor: 'Market cap rankings'
      },
      {
        name: 'CoinStats Market Cap',
        endpoint: '/api/coinstats/coins',
        params: () => ({ limit: 10, sortBy: 'marketCap' }),
        description: 'Alternative market cap data',
        strength: 'Cross-verification',
        bestFor: 'Confirming market cap data'
      }
    ]
  };

  /**
   * Intelligently select APIs using GPT-4
   * @param {object} understanding - Output from Reasoning Agent
   * @param {object} userContext - User context (wallet, etc.)
   * @returns {Promise<Array>} List of selected API calls
   */
  static async selectAPIs(understanding, userContext = {}) {
    console.log('🤖 [API Selection Agent] Analyzing best APIs to call...');
    
    const needed = understanding.to_answer_need || [];
    const entities = understanding.entities_mentioned || {};
    
    // Build catalog summary for GPT
    let catalogSummary = '\n\nAVAILABLE API CATALOG:\n';
    needed.forEach(dataType => {
      const apis = this.API_CATALOG[dataType] || [];
      if (apis.length > 0) {
        catalogSummary += `\n${dataType.toUpperCase()}:\n`;
        apis.forEach((api, idx) => {
          catalogSummary += `  ${idx + 1}. ${api.name}\n`;
          catalogSummary += `     - ${api.description}\n`;
          catalogSummary += `     - Strength: ${api.strength}\n`;
          catalogSummary += `     - Best for: ${api.bestFor}\n`;
        });
      }
    });
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent API selection strategist for a crypto assistant.

USER WANTS: ${understanding.user_wants}
USER URGENCY: ${understanding.urgency}
REASONING: ${understanding.reasoning}
ENTITIES: ${JSON.stringify(entities)}

${catalogSummary}

YOUR JOB:
Analyze the user's needs and SELECT the BEST combination of APIs to call.

SELECTION STRATEGY:
1. **Comprehensive Coverage**: Select ALL relevant APIs per data type for maximum data richness
2. **Diversity**: Choose APIs with different strengths (e.g., CoinGecko + Binance + Twitter + Lurky)
3. **Context-Aware**: Consider what the user is actually asking for
4. **Maximum Data**: Pick 5-8 APIs per data type when available, not just 3-5
5. **Complementary**: Select APIs that complement each other
6. **Redundancy**: Include multiple sources for the same data type to ensure reliability

EXAMPLES:
- For "What's Bitcoin's price?" → Select: CoinGecko (general), Binance (real-time), Binance Ticker (24h context)
- For "What's trending on TON?" → Select: CoinGecko Ecosystem, Twitter Trending, Lurky Trending, Web Search
- For "ETH sentiment?" → Select: Twitter Sentiment, Lurky Sentiment, Protokols Analysis

RESPOND WITH JSON:
{
  "selections": [
    {
      "dataType": "<data type>",
      "apiName": "<exact API name from catalog>",
      "reasoning": "<why this API is valuable for this query>"
    }
  ],
  "strategy": "<overall strategy explanation>"
}

Be intelligent. Think comprehensively. Select ALL relevant APIs per data type for mind-blowing answers! Prioritize comprehensive data collection over efficiency.`
          },
          {
            role: 'user',
            content: `Select the best APIs to answer: "${understanding.user_wants}"`
          }
        ],
        temperature: 0.4,
        max_tokens: 800
      });

      const aiSelection = JSON.parse(response.choices[0].message.content);
      console.log('🤖 [API Selection Agent] AI Strategy:', aiSelection.strategy);
      console.log('🤖 [API Selection Agent] Selected', aiSelection.selections.length, 'APIs');
      
      // Map AI selections to actual API calls
      const apiCalls = [];
      
      aiSelection.selections.forEach(selection => {
        const dataTypeAPIs = this.API_CATALOG[selection.dataType];
        if (!dataTypeAPIs) {
          console.warn(`⚠️ [API Selection Agent] Unknown data type: ${selection.dataType}`);
          return;
        }
        
        // Find the selected API by name
        const selectedAPI = dataTypeAPIs.find(api => api.name === selection.apiName);
        if (!selectedAPI) {
          console.warn(`⚠️ [API Selection Agent] API not found: ${selection.apiName}`);
          return;
        }
        
        // Check condition if present
        if (selectedAPI.condition && !selectedAPI.condition(entities, userContext.address)) {
          console.log(`⏭️ [API Selection Agent] Skipping ${selection.apiName} (condition not met)`);
          return;
        }
        
        // Build the API call
        apiCalls.push({
          dataType: selection.dataType,
          endpoint: selectedAPI.endpoint,
          params: selectedAPI.params(entities, userContext.address, understanding),
          priority: understanding.urgency,
          entities,
          reasoning: selection.reasoning
        });
        
        console.log(`✅ [API Selection Agent] Selected: ${selection.apiName} - ${selection.reasoning}`);
      });
      
      console.log(`🎯 [API Selection Agent] Final selection: ${apiCalls.length} API calls`);
      
      return apiCalls;
      
    } catch (error) {
      console.error('🤖 [API Selection Agent] Error:', error);
      
      // Fallback: Use first API for each data type (old behavior)
      console.log('⚠️ [API Selection Agent] Falling back to simple selection');
      const apiCalls = [];
      
      needed.forEach(dataType => {
        const availableAPIs = this.API_CATALOG[dataType];
        if (availableAPIs && availableAPIs.length > 0) {
          const firstAPI = availableAPIs[0];
          apiCalls.push({
            dataType,
            endpoint: firstAPI.endpoint,
            params: firstAPI.params(entities, userContext.address, understanding),
            priority: understanding.urgency,
            entities
          });
        }
      });
      
      return apiCalls;
    }
  }
}

