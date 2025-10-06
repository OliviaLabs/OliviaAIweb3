import OpenAI from 'openai';
import { config } from '../config/config.js';
import https from 'https';

// ⚡ Enable HTTP keep-alive to reuse TCP connections across requests
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 50
});

const openai = new OpenAI({ 
  apiKey: config.openaiApiKey,
  httpAgent: httpsAgent
});

class IntentAgent {
  
  // ⚡ Fast-path regex for OBVIOUS cases only (30-50% hit rate, sub-10ms)
  fastClassify(message, activeToken) {
    const lower = message.toLowerCase().trim();
    
    // 🤝 Greetings (high confidence)
    if (/^(hey|hi|hello|sup|yo|heya|what's up)[\s!?.]*$/i.test(lower)) {
      return {
        intent_type: 'general',
        confidence: 0.95,
        target: { type: 'portfolio', blockchain: null, tokens: null },
        data_requirements: { trending_data: false, price_data: false, historical_price: false, social_sentiment: false, news_catalyst: false, on_chain_metrics: false, portfolio_data: false, liquidity_data: false },
        user_wants: ['validation'],
        context: { is_follow_up: false, references_previous_token: null, urgency: 'low' }
      };
    }
    
    // 🌐 Ecosystem queries (high confidence)
    const ecoMatch = lower.match(/\b(what'?s?|any|show|list|find).*(pump|trend|hot|action|happening|moving).*\b(on|in|within)\s+(ton|bnb|sol|solana|eth|ethereum|base|arb|arbitrum|polygon|matic|avax|avalanche|bsc|binance)\b/i);
    if (ecoMatch) {
      const chain = ecoMatch[4].toUpperCase();
      return {
        intent_type: 'trending_ecosystem',
        confidence: 0.9,
        target: { type: 'blockchain_ecosystem', blockchain: chain, tokens: null },
        data_requirements: { trending_data: true, price_data: true, historical_price: false, social_sentiment: true, news_catalyst: true, on_chain_metrics: false, portfolio_data: false, liquidity_data: true },
        user_wants: ['list', 'explanation'],
        context: { is_follow_up: false, references_previous_token: null, urgency: 'high' }
      };
    }
    
    return null; // ❌ Not obvious → use AI
  }
  
  async classify(message, conversationHistory = [], activeToken = null, userWallet = null) {
    console.log('🧠 [Intent Agent] Classifying:', message);
    
    // ⚡ Try fast-path first
    const fastResult = this.fastClassify(message, activeToken);
    if (fastResult) {
      console.log('⚡ [Intent Agent] Fast-path hit:', fastResult.intent_type);
      return fastResult;
    }
    
    // 📋 Structured output schema (FORCES complete, valid JSON)
    const intentSchema = {
      type: "json_schema",
      json_schema: {
        name: "intent_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            intent_type: { 
              type: "string",
              enum: ["trending_ecosystem", "specific_token", "causal_analysis", "comparison", "portfolio", "swap", "recommendation", "follow_up", "general"]
            },
            confidence: { type: "number" },
            target: {
              type: "object",
              properties: {
                type: { 
                  type: "string",
                  enum: ["blockchain_ecosystem", "specific_token", "portfolio", "multiple_tokens"]
                },
                blockchain: { type: ["string", "null"] },
                tokens: {
                  anyOf: [
                    { type: "array", items: { type: "string" } },
                    { type: "null" }
                  ]
                }
              },
              required: ["type", "blockchain", "tokens"],
              additionalProperties: false
            },
            data_requirements: {
              type: "object",
              properties: {
                trending_data: { type: "boolean" },
                price_data: { type: "boolean" },
                historical_price: { type: "boolean" },
                social_sentiment: { type: "boolean" },
                news_catalyst: { type: "boolean" },
                on_chain_metrics: { type: "boolean" },
                portfolio_data: { type: "boolean" },
                liquidity_data: { type: "boolean" }
              },
              required: ["trending_data", "price_data", "historical_price", "social_sentiment", "news_catalyst", "on_chain_metrics", "portfolio_data", "liquidity_data"],
              additionalProperties: false
            },
            user_wants: {
              type: "array",
              items: {
                type: "string",
                enum: ["list", "explanation", "recommendation", "comparison", "validation"]
              }
            },
            context: {
              type: "object",
              properties: {
                is_follow_up: { type: "boolean" },
                references_previous_token: { type: ["string", "null"] },
                urgency: { 
                  type: "string",
                  enum: ["low", "medium", "high"]
                }
              },
              required: ["is_follow_up", "references_previous_token", "urgency"],
              additionalProperties: false
            }
          },
          required: ["intent_type", "confidence", "target", "data_requirements", "user_wants", "context"],
          additionalProperties: false
        }
      }
    };
    
    const systemPrompt = `Classify crypto queries. Infer ecosystem vs native token. Resolve pronouns using context.

🔍 PRONOUN RESOLUTION (CRITICAL):
- If message contains "it", "this", "that", "them" → check activeToken OR last discussed token
- Example: After discussing "Zcash", user asks "why would you buy it?" → "it" = Zcash

🎯 ECOSYSTEM vs NATIVE TOKEN:
- "on/in blockchain" → ecosystem | "about/how is blockchain" → token
- "what's pumping ON TON?" → TON ecosystem tokens (trending_ecosystem)
- "how is TON?" → TON native token (specific_token)

OTHER:
- Greetings: general (don't continue previous topic)
- "why/because": causal_analysis
- Follow-up: ONLY if continuing discussion (not greetings)`;

    // 📦 Compact user prompt (save tokens)
    let userPrompt = `MSG:"${message}"\n`;
    
    if (conversationHistory.length > 0) {
      userPrompt += `HISTORY:\n`;
      conversationHistory.slice(-5).forEach(msg => {
        userPrompt += `${msg.role[0]}:"${msg.content.substring(0, 100)}"\n`;
      });
    }
    
    if (activeToken) {
      userPrompt += `ACTIVE:${activeToken.symbol}|${activeToken.name}\n`;
    }
    
    if (userWallet) {
      userPrompt += `WALLET:${userWallet.substring(0, 10)}...\n`;
    }
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: intentSchema,  // ✅ Structured outputs (forces complete JSON)
        temperature: 0,  // ✅ Deterministic
        max_tokens: 150
      });
      
      const intent = JSON.parse(completion.choices[0].message.content);
      console.log('✅ [Intent Agent] Classified as:', intent.intent_type, '| Target:', intent.target.tokens || intent.target.blockchain || 'general');
      
      return intent;
      
    } catch (error) {
      console.error('❌ [Intent Agent] Error:', error);
      return this.getFallbackIntent(message, activeToken, conversationHistory);
    }
  }
  
  getFallbackIntent(message, activeToken, conversationHistory = []) {
    console.log('⚠️ [Intent Agent] Using fallback classification');
    
    const lowerMsg = message.toLowerCase();
    
    // 🔍 Pronoun detection → use activeToken
    if (/(^|\s)(it|this|that|them)(\s|$|[?.!,])/.test(lowerMsg)) {
      if (activeToken) {
        console.log('⚠️ [Fallback] Detected pronoun, using activeToken:', activeToken.symbol);
        return {
          intent_type: 'causal_analysis',
          confidence: 0.7,
          target: { type: 'specific_token', blockchain: null, tokens: [activeToken.symbol] },
          data_requirements: { trending_data: false, price_data: true, historical_price: true, social_sentiment: true, news_catalyst: true, on_chain_metrics: false, portfolio_data: false, liquidity_data: false },
          user_wants: ['explanation', 'recommendation'],
          context: { is_follow_up: true, references_previous_token: activeToken.symbol, urgency: 'medium' }
        };
      }
    }
    
    if (lowerMsg.includes('pump') || lowerMsg.includes('trending')) {
      return {
        intent_type: 'trending_ecosystem',
        confidence: 0.5,
        target: { type: 'blockchain_ecosystem', blockchain: null, tokens: null },
        data_requirements: { trending_data: true, price_data: true, historical_price: false, social_sentiment: true, news_catalyst: false, on_chain_metrics: false, portfolio_data: false, liquidity_data: true },
        user_wants: ['list'],
        context: { is_follow_up: false, references_previous_token: null, urgency: 'high' }
      };
    }
    
    if (activeToken) {
      return {
        intent_type: 'specific_token',
        confidence: 0.6,
        target: { type: 'specific_token', blockchain: null, tokens: [activeToken.symbol] },
        data_requirements: { trending_data: false, price_data: true, historical_price: false, social_sentiment: true, news_catalyst: false, on_chain_metrics: false, portfolio_data: false, liquidity_data: false },
        user_wants: ['explanation'],
        context: { is_follow_up: false, references_previous_token: null, urgency: 'medium' }
      };
    }
    
    return {
      intent_type: 'general',
      confidence: 0.3,
      target: { type: 'portfolio', blockchain: null, tokens: null },
      data_requirements: { trending_data: false, price_data: false, historical_price: false, social_sentiment: false, news_catalyst: false, on_chain_metrics: false, portfolio_data: false, liquidity_data: false },
      user_wants: ['validation'],
      context: { is_follow_up: false, references_previous_token: null, urgency: 'low' }
    };
  }
}

export default new IntentAgent();
