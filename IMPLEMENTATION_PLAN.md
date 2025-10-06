# Olivia AI - Multi-Agent Implementation Plan
## Step-by-Step Code Implementation

---

## PHASE 1: BACKEND AGENT SYSTEM

### Step 1.1: Create Intent Agent

**File**: `microservice/src/agents/intentAgent.js`

```javascript
import OpenAI from 'openai';
import { config } from '../config/config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

class IntentAgent {
  
  /**
   * Classify user intent
   * @param {string} message - User's message
   * @param {Array} conversationHistory - Last 10 messages
   * @param {Object} activeToken - Currently active token (if any)
   * @param {string} userWallet - User's wallet address (if connected)
   * @returns {Promise<Object>} Intent classification
   */
  async classify(message, conversationHistory = [], activeToken = null, userWallet = null) {
    console.log('🧠 [Intent Agent] Classifying:', message);
    
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(message, conversationHistory, activeToken, userWallet);
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,  // Lower temperature for consistent classification
        max_tokens: 500
      });
      
      const intent = JSON.parse(completion.choices[0].message.content);
      console.log('✅ [Intent Agent] Classified as:', intent.intent_type);
      
      return intent;
      
    } catch (error) {
      console.error('❌ [Intent Agent] Error:', error);
      
      // Fallback to basic intent
      return this.getFallbackIntent(message, activeToken);
    }
  }
  
  buildSystemPrompt() {
    return `You are an intent classification specialist for a cryptocurrency AI assistant.

TASK: Analyze user messages and extract PRECISE intent.

CRITICAL DISTINCTIONS:
- "What's pumping on TON?" = trending tokens IN TON ecosystem (blockchain_ecosystem)
- "How is TON doing?" = specific TON token analysis (specific_token)
- "Compare BTC and ETH" = multi-token comparison (comparison)
- "Why is Corn pumping?" = deep causal analysis (causal_analysis)
- "Should I buy?" = recommendation with risk assessment (recommendation)
- "yeah" / "tell me more" after previous token mention = follow-up (follow_up)

CONVERSATION CONTEXT:
- If previous message mentioned a token, user may be asking about THAT token
- "why?" after "Corn is pumping" = "Why is Corn pumping?"
- "tell me more" = expand on the previous topic

OUTPUT FORMAT (JSON):
{
  "intent_type": "trending_ecosystem | specific_token | causal_analysis | comparison | portfolio | swap | recommendation | follow_up | general",
  "confidence": 0.0-1.0,
  "target": {
    "type": "blockchain_ecosystem | specific_token | portfolio | multiple_tokens",
    "blockchain": "TON | SOLANA | ETHEREUM | BASE | POLYGON | null",
    "tokens": ["TOKEN1", "TOKEN2"] or null
  },
  "data_requirements": {
    "trending_data": true/false,
    "price_data": true/false,
    "historical_price": true/false,
    "social_sentiment": true/false,
    "news_catalyst": true/false,
    "on_chain_metrics": true/false,
    "portfolio_data": true/false,
    "liquidity_data": true/false
  },
  "user_wants": ["list", "explanation", "recommendation", "comparison", "validation"],
  "context": {
    "is_follow_up": true/false,
    "references_previous_token": "TOKEN" or null,
    "urgency": "low | medium | high"
  }
}

Be precise. Output ONLY valid JSON.`;
  }
  
  buildUserPrompt(message, conversationHistory, activeToken, userWallet) {
    let prompt = `User message: "${message}"\n\n`;
    
    if (conversationHistory.length > 0) {
      prompt += `Recent conversation:\n`;
      conversationHistory.slice(-5).forEach(msg => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });
      prompt += `\n`;
    }
    
    if (activeToken) {
      prompt += `Active token context: ${JSON.stringify(activeToken)}\n\n`;
    }
    
    if (userWallet) {
      prompt += `User wallet connected: ${userWallet}\n\n`;
    }
    
    prompt += `Classify the intent. Output JSON only.`;
    
    return prompt;
  }
  
  getFallbackIntent(message, activeToken) {
    console.log('⚠️ [Intent Agent] Using fallback classification');
    
    const lowerMsg = message.toLowerCase();
    
    // Basic keyword matching
    if (lowerMsg.includes('pump') || lowerMsg.includes('trending')) {
      return {
        intent_type: 'trending_ecosystem',
        confidence: 0.5,
        target: { type: 'blockchain_ecosystem', tokens: null },
        data_requirements: { trending_data: true, price_data: true, social_sentiment: true }
      };
    }
    
    if (activeToken) {
      return {
        intent_type: 'specific_token',
        confidence: 0.6,
        target: { type: 'specific_token', tokens: [activeToken.symbol] },
        data_requirements: { price_data: true, social_sentiment: true }
      };
    }
    
    return {
      intent_type: 'general',
      confidence: 0.3,
      target: { type: 'general', tokens: null },
      data_requirements: {}
    };
  }
}

export default new IntentAgent();
```

---

### Step 1.2: Create Data Router Service

**File**: `microservice/src/services/dataRouterService.js`

```javascript
import coinGeckoService from './coinGeckoService.js';
import twitterService from './twitterService.js';
import protokolsService from './protokolsService.js';
import lurkyService from './lurkyService.js';
import tonCenterService from './tonCenterService.js';
import chainbaseService from './chainbaseService.js';
// Import all other API services...

class DataRouterService {
  
  /**
   * Route intent to API calls
   * @param {Object} intent - Intent from Intent Agent
   * @returns {Object} Routing plan
   */
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
        // Follow-ups usually refer to previous token
        if (intent.context.references_previous_token) {
          intent.target.tokens = [intent.context.references_previous_token];
          calls.push(...this.routeSpecificToken(intent));
        }
        break;
        
      default:
        console.log('⚠️ [Data Router] Unknown intent type, using general approach');
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
    
    console.log(`🌐 [Data Router] Routing trending for blockchain: ${blockchain}`);
    
    // CoinGecko trending (always useful)
    calls.push({
      service: 'coingecko',
      method: 'getTrending',
      params: {},
      priority: 'high',
      timeout: 2000
    });
    
    // Blockchain-specific routing
    if (blockchain === 'TON') {
      calls.push({
        service: 'ton_center',
        method: 'getPopularJettons',
        params: {},
        priority: 'high',
        timeout: 2000
      });
    }
    
    // Protokols for narratives
    if (intent.data_requirements.social_sentiment) {
      calls.push({
        service: 'protokols',
        method: 'getNarratives',
        params: { blockchain: blockchain?.toLowerCase() },
        priority: 'medium',
        timeout: 3000
      });
    }
    
    // Twitter ecosystem search
    if (intent.data_requirements.social_sentiment && blockchain) {
      calls.push({
        service: 'twitter',
        method: 'search',
        params: { 
          query: `${blockchain} ecosystem pumping -airdrop -giveaway`,
          limit: 20
        },
        priority: 'medium',
        timeout: 2000
      });
    }
    
    return calls;
  }
  
  routeSpecificToken(intent) {
    const tokens = intent.target.tokens || [];
    const calls = [];
    
    console.log(`🎯 [Data Router] Routing for tokens:`, tokens);
    
    tokens.forEach(tokenSymbol => {
      
      // ALWAYS get price data
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
      
      // Social sentiment
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
        
        calls.push({
          service: 'lurky',
          method: 'searchToken',
          params: { symbol: tokenSymbol.toUpperCase() },
          priority: 'medium',
          timeout: 2000,
          token: tokenSymbol
        });
      }
      
      // News catalyst (especially for "why is X pumping")
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
      
      // Historical price (for causal analysis)
      if (intent.data_requirements.historical_price) {
        calls.push({
          service: 'coingecko',
          method: 'getHistoricalData',
          params: { 
            coinId: tokenSymbol.toLowerCase(),
            days: 1
          },
          priority: 'medium',
          timeout: 3000,
          token: tokenSymbol
        });
      }
      
      // On-chain metrics
      if (intent.data_requirements.on_chain_metrics) {
        calls.push({
          service: 'chainbase',
          method: 'getTokenHolders',
          params: { symbol: tokenSymbol.toUpperCase() },
          priority: 'low',
          timeout: 3000,
          token: tokenSymbol
        });
      }
      
      // Liquidity data (for swap questions)
      if (intent.data_requirements.liquidity_data) {
        calls.push({
          service: 'zerox',
          method: 'getLiquidity',
          params: { token: tokenSymbol.toUpperCase() },
          priority: 'medium',
          timeout: 2000,
          token: tokenSymbol
        });
      }
    });
    
    return calls;
  }
  
  routeComparison(intent) {
    // For each token, get comprehensive data
    return this.routeSpecificToken({
      ...intent,
      data_requirements: {
        price_data: true,
        historical_price: true,
        social_sentiment: true,
        on_chain_metrics: true
      }
    });
  }
  
  routePortfolio(intent) {
    const calls = [];
    
    // This would be called from frontend usually, but we can support it
    calls.push({
      service: 'alchemy',
      method: 'getTokenBalances',
      params: { address: intent.wallet_address },
      priority: 'high',
      timeout: 3000
    });
    
    return calls;
  }
  
  routeGeneral(intent) {
    // Fallback: just get trending data
    return [{
      service: 'coingecko',
      method: 'getTrending',
      params: {},
      priority: 'high',
      timeout: 2000
    }];
  }
  
  /**
   * Execute routing plan
   * @param {Object} routingPlan - Plan from route()
   * @returns {Promise<Object>} Organized results by service
   */
  async execute(routingPlan) {
    const { api_calls, max_wait } = routingPlan;
    
    console.log(`🚀 [Data Router] Executing ${api_calls.length} API calls...`);
    
    const startTime = Date.now();
    
    try {
      // Execute all calls in parallel with timeout
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
      
      // Organize results by service and token
      const organized = this.organizeResults(results, api_calls);
      
      return organized;
      
    } catch (error) {
      console.log(`⏱️ [Data Router] Timeout at ${max_wait}ms, returning partial data`);
      return {};
    }
  }
  
  async executeCall(call) {
    const { service, method, params, timeout, token } = call;
    
    console.log(`  📡 [${service}] ${method}(${JSON.stringify(params)})`);
    
    try {
      // Add timeout to each call
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
    // Map to actual service calls
    switch(service) {
      case 'coingecko':
        return await this.callCoinGecko(method, params);
      
      case 'twitter':
        return await twitterService[method](params);
      
      case 'protokols':
        return await protokolsService[method](params);
      
      case 'lurky':
        return await lurkyService[method](params);
      
      case 'ton_center':
        return await tonCenterService[method](params);
      
      case 'chainbase':
        return await chainbaseService[method](params);
      
      case 'cryptopanic':
        return await this.callCryptoPanic(method, params);
      
      // Add all other services...
      
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }
  
  async callCoinGecko(method, params) {
    // Implement CoinGecko API calls
    const baseUrl = 'https://api.coingecko.com/api/v3';
    
    switch(method) {
      case 'getTrending':
        const res1 = await fetch(`${baseUrl}/search/trending`);
        return await res1.json();
      
      case 'searchAndGetPrice':
        const searchRes = await fetch(`${baseUrl}/search?query=${params.query}`);
        const searchData = await searchRes.json();
        if (searchData.coins && searchData.coins[0]) {
          const coinId = searchData.coins[0].id;
          const priceRes = await fetch(`${baseUrl}/coins/${coinId}`);
          return await priceRes.json();
        }
        return null;
      
      case 'getHistoricalData':
        const res2 = await fetch(`${baseUrl}/coins/${params.coinId}/market_chart?vs_currency=usd&days=${params.days}`);
        return await res2.json();
      
      default:
        throw new Error(`Unknown CoinGecko method: ${method}`);
    }
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
        
        // Organize by service
        if (!organized.by_service[result.value.service]) {
          organized.by_service[result.value.service] = [];
        }
        organized.by_service[result.value.service].push(result.value.data);
        
        // Organize by token (if applicable)
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
```

---

### Step 1.3: Create Analyst Agent

**File**: `microservice/src/agents/analystAgent.js`

```javascript
import OpenAI from 'openai';
import { config } from '../config/config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

class AnalystAgent {
  
  /**
   * Analyze raw data and extract insights
   * @param {Object} rawData - Organized data from Data Router
   * @param {string} userQuestion - Original user question
   * @param {Object} intent - Intent classification
   * @returns {Promise<Object>} Analysis with findings and evidence
   */
  async analyze(rawData, userQuestion, intent) {
    console.log('🔬 [Analyst Agent] Analyzing data...');
    
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(rawData, userQuestion, intent);
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1500
      });
      
      const analysis = JSON.parse(completion.choices[0].message.content);
      console.log('✅ [Analyst Agent] Found', analysis.key_findings?.length || 0, 'key findings');
      
      return analysis;
      
    } catch (error) {
      console.error('❌ [Analyst Agent] Error:', error);
      
      // Return basic analysis
      return this.getFallbackAnalysis(rawData, userQuestion);
    }
  }
  
  buildSystemPrompt() {
    return `You are a professional cryptocurrency data analyst.

TASK: Analyze raw API data and extract KEY INSIGHTS with EVIDENCE.

ANALYSIS FRAMEWORK:

1. IDENTIFY KEY FINDINGS
   - What are the 3-5 most important data points?
   - CITE SPECIFIC NUMBERS: "$0.012" not "low price", "45%" not "big increase"
   - CITE SOURCES: "CoinGecko shows..." or "Twitter data indicates..."
   - Rate confidence (0-1) based on data quality

2. SENTIMENT ANALYSIS
   - Calculate overall sentiment score (0-1, where 1 = very bullish)
   - Break down by: price_action, social_sentiment, news_sentiment
   - Determine signal: STRONG_BULLISH | BULLISH | NEUTRAL | BEARISH | STRONG_BEARISH

3. PATTERN VALIDATION
   - Does price action align with social sentiment? (price up + bullish tweets = VALIDATED)
   - Is there volume confirmation? (high volume = real movement)
   - Are there news catalysts? (news + price action = CATALYST_DRIVEN)
   - Identify risk flags: ["High volatility", "Low liquidity", "New token"]

4. ANSWER THE USER'S QUESTION
   - What SPECIFICALLY answers their question?
   - What supporting evidence exists?
   - What are the secondary insights?
   - What risks should they know about?

OUTPUT FORMAT (JSON):
{
  "key_findings": [
    {
      "finding": "Specific statement with numbers",
      "evidence": "Quote the data source",
      "confidence": 0.0-1.0,
      "data_source": "coingecko | twitter | protokols | etc."
    }
  ],
  "sentiment_analysis": {
    "overall_score": 0.0-1.0,
    "breakdown": {
      "price_action": 0.0-1.0,
      "social_sentiment": 0.0-1.0,
      "news_sentiment": 0.0-1.0
    },
    "signal": "STRONG_BULLISH | BULLISH | NEUTRAL | BEARISH | STRONG_BEARISH"
  },
  "pattern_validation": {
    "price_social_alignment": true/false,
    "volume_confirmation": true/false,
    "news_catalyst_present": true/false,
    "risk_flags": ["array", "of", "risks"]
  },
  "answer_to_user_question": {
    "primary_answer": "Direct answer to their question",
    "secondary_insights": ["array", "of", "additional", "insights"],
    "risk_warnings": ["array", "of", "warnings"]
  }
}

CRITICAL: Be PRECISE. Don't say "positive sentiment" - say "15 bullish tweets vs 3 bearish = 83% positive".

Output ONLY valid JSON.`;
  }
  
  buildUserPrompt(rawData, userQuestion, intent) {
    let prompt = `User asked: "${userQuestion}"\n\n`;
    prompt += `Intent type: ${intent.intent_type}\n\n`;
    prompt += `Raw data from APIs:\n`;
    prompt += `${JSON.stringify(rawData, null, 2)}\n\n`;
    prompt += `Analyze this data and extract key insights. Output JSON only.`;
    
    return prompt;
  }
  
  getFallbackAnalysis(rawData, userQuestion) {
    console.log('⚠️ [Analyst Agent] Using fallback analysis');
    
    return {
      key_findings: [{
        finding: "Data was fetched from multiple sources",
        evidence: `Received data from ${Object.keys(rawData.by_service || {}).join(', ')}`,
        confidence: 0.5,
        data_source: "system"
      }],
      sentiment_analysis: {
        overall_score: 0.5,
        breakdown: {},
        signal: "NEUTRAL"
      },
      pattern_validation: {
        risk_flags: ["Unable to analyze data automatically"]
      },
      answer_to_user_question: {
        primary_answer: "I fetched the available data but need to process it further.",
        secondary_insights: [],
        risk_warnings: []
      }
    };
  }
}

export default new AnalystAgent();
```

---

### Step 1.4: Create Response Agent

**File**: `microservice/src/agents/responseAgent.js`

```javascript
import OpenAI from 'openai';
import { config } from '../config/config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

class ResponseAgent {
  
  /**
   * Generate natural language response
   * @param {Object} analysis - Analysis from Analyst Agent
   * @param {string} userQuestion - Original question
   * @param {Array} conversationHistory - Recent messages
   * @returns {Promise<string>} Natural language response
   */
  async generate(analysis, userQuestion, conversationHistory = []) {
    console.log('✍️ [Response Agent] Generating response...');
    
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(analysis, userQuestion);
    
    // Add conversation history for context
    const messages = [
      { role: "system", content: systemPrompt }
    ];
    
    // Add last 3 conversation messages for context
    conversationHistory.slice(-3).forEach(msg => {
      messages.push(msg);
    });
    
    // Add current analysis
    messages.push({ role: "user", content: userPrompt });
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 400
      });
      
      const response = completion.choices[0].message.content;
      console.log('✅ [Response Agent] Generated response');
      
      return response;
      
    } catch (error) {
      console.error('❌ [Response Agent] Error:', error);
      
      // Fallback to formatted analysis
      return this.formatAnalysisAsFallback(analysis);
    }
  }
  
  buildSystemPrompt() {
    return `You are Olivia, a professional cryptocurrency AI assistant.

TASK: Craft natural, conversational responses based on analyzed data.

STYLE RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DO:
- Write like a professional analyst talking to a friend
- Use short paragraphs with line breaks
- Cite SPECIFIC NUMBERS: "$0.012" not "low price"
- Quote EVIDENCE: "According to Twitter data..." or "CoinGecko shows..."
- Connect patterns: "Price up 45% AND social volume up 500% = validated momentum"
- Max 6-8 sentences total

❌ DO NOT:
- Use ANY emojis (no ✅📈🔴💰🎯)
- Use section headers (not even **BOLD** like **PRICE:** or **SIGNAL:**)
- Use bullet points
- Make generic statements without data
- Say "according to the data" - just cite the source naturally

FORBIDDEN PHRASES:
❌ "**PRICE & SIGNAL:**"
❌ "**SOCIAL PROOF:**"
❌ "**VALIDATION:**"
❌ "**ACTION:**"
❌ Any emojis

EXAMPLE (GOOD):
"DOGS is leading on TON with a 45% jump to $0.012 in the last 24 hours. NOT and STON are also up 30% and 22% respectively.

Twitter volume for DOGS has spiked 500% compared to its usual activity. Protokols shows the TON gaming narrative as the top trending topic with 47 KOL mentions.

The price action aligns with the social buzz, and volume confirms this is real momentum. Keep in mind DOGS is relatively new, so expect volatility."

EXAMPLE (BAD):
"**PRICE & SIGNAL:** 📈
DOGS is pumping! 🚀

**SOCIAL PROOF:**
✅ Twitter is bullish
✅ KOLs are talking about it

**ACTION:** Consider buying! 💰"

Think: "How would a smart trader explain this over coffee?" - NO labels, NO emojis, just talk naturally.`;
  }
  
  buildUserPrompt(analysis, userQuestion) {
    let prompt = `User asked: "${userQuestion}"\n\n`;
    prompt += `ANALYZED DATA:\n`;
    prompt += `${JSON.stringify(analysis, null, 2)}\n\n`;
    prompt += `Generate a natural, conversational response that answers their question using this analyzed data.`;
    
    return prompt;
  }
  
  formatAnalysisAsFallback(analysis) {
    console.log('⚠️ [Response Agent] Using fallback formatting');
    
    let response = analysis.answer_to_user_question.primary_answer + '\n\n';
    
    if (analysis.key_findings && analysis.key_findings.length > 0) {
      const topFinding = analysis.key_findings[0];
      response += topFinding.finding + '\n\n';
    }
    
    if (analysis.answer_to_user_question.secondary_insights?.length > 0) {
      response += analysis.answer_to_user_question.secondary_insights.join('. ') + '.';
    }
    
    return response;
  }
}

export default new ResponseAgent();
```

---

## Continue in next file...

This is getting long. Should I create a separate file for the controller and routes implementation?

