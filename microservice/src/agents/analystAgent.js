import OpenAI from 'openai';
import { config } from '../config/config.js';
import https from 'https';

// ⚡ Enable HTTP keep-alive to reuse TCP connections
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 50
});

const openai = new OpenAI({ 
  apiKey: config.openaiApiKey,
  httpAgent: httpsAgent
});

class AnalystAgent {
  
  // ⚡ SPEED: Ultra-aggressive compression (top 5 tokens, 3 tweets, 2 news) - cuts data 66%
  compressAPIData(rawData) {
    const compressed = { by_service: {} };
    
    // CoinGecko - TOP 5 TOKENS SORTED BY 24H CHANGE (⚡ reduced from 15 for speed)
    if (rawData.by_service?.coingecko) {
      compressed.by_service.coingecko = rawData.by_service.coingecko.map(data => {
        if (Array.isArray(data)) {
          // Sort by 24h price change (biggest gainers first)
          const sorted = [...data].sort((a, b) => 
            (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
          );
          // Keep top 5 pumping tokens (enough to show trend)
          return sorted.slice(0, 5).map(t => ({
            name: t.name, 
            symbol: t.symbol, 
            price: t.current_price, 
            change_24h: t.price_change_percentage_24h,
            market_cap: t.market_cap,
            volume_24h: t.total_volume
          }));
        }
        // For trending format, keep top 5
        return data.coins ? { coins: data.coins.slice(0, 5).map(c => ({
          name: c.item?.name, 
          symbol: c.item?.symbol,
          price_change_24h: c.item?.data?.price_change_percentage_24h?.usd
        }))} : data;
      });
    }
    
    // Twitter - top 3 tweets, 60 char excerpts (⚡ reduced from 5 tweets, 80 chars)
    if (rawData.by_service?.twitter) {
      compressed.by_service.twitter = rawData.by_service.twitter.slice(0, 3).map(t => ({
        text: t.text?.substring(0, 60)
      }));
    }
    
    // News - top 2 headlines, 60 char max (⚡ reduced from 3 headlines, 80 chars)
    if (rawData.by_service?.cryptopanic) {
      compressed.by_service.cryptopanic = rawData.by_service.cryptopanic.slice(0, 2).map(n => ({
        title: n.title?.substring(0, 60)
      }));
    }
    
    // Other services - keep as-is or summarize if large
    ['coinstats', 'lurky', 'okx', 'changenow', 'zerox', 'protokols', 'alchemy', 'chainbase', 'toncenter'].forEach(s => {
      if (rawData.by_service?.[s]) compressed.by_service[s] = rawData.by_service[s];
    });
    
    const before = JSON.stringify(rawData).length;
    const after = JSON.stringify(compressed).length;
    console.log(`⚡ [Analyst] Data: ${before} → ${after} chars (${Math.round((1-after/before)*100)}% reduction)`);
    
    return compressed;
  }
  
  async analyze(rawData, userQuestion, intent) {
    console.log('🔬 [Analyst Agent] Analyzing data...');
    
    // 🔍 PREPROCESS DATA FOR ECOSYSTEM QUERIES (KEEP THIS LOGIC)
    if (intent.intent_type === 'trending_ecosystem' && intent.target.blockchain) {
      rawData = this.filterForEcosystem(rawData, intent.target.blockchain);
    }
    
    // ⚡ COMPRESS DATA SIZE (but keep all analysis logic below)
    rawData = this.compressAPIData(rawData);
    
    const systemPrompt = `You are a professional cryptocurrency data analyst.

TASK: Analyze raw API data and extract KEY INSIGHTS with EVIDENCE.

⏰ TIMEFRAME CONTEXT:
- User queries about "pumping", "trending", "hot" typically refer to RECENT 24-hour activity
- Prioritize change_24h data when analyzing price movements
- If discussing gains, be specific about timeframe naturally (don't force phrases)
- Balance recency with context - sometimes 7d trend matters for full picture
- Use judgment: if user asks "what's happening", they likely mean "right now" (24h)

ANALYSIS FRAMEWORK:

1. IDENTIFY KEY FINDINGS
   - What are the 3-5 most important data points?
   - CITE SPECIFIC NUMBERS: "$0.012" not "low price", "45%" not "big increase"
   - CITE SOURCES: "CoinGecko shows..." or "Twitter data indicates..."
   - Be clear about timeframes naturally (e.g., "jumped 45% today" or "up 12% over 24 hours")
   - Rate confidence (0-1) based on data quality

2. SENTIMENT ANALYSIS (24H FOCUS)
   - Calculate overall sentiment score (0-1, where 1 = very bullish)
   - Break down by: price_action (24h), social_sentiment (recent), news_sentiment (24h)
   - Determine signal: STRONG_BULLISH | BULLISH | NEUTRAL | BEARISH | STRONG_BEARISH

3. PATTERN VALIDATION
   - Does price action align with social sentiment?
   - Is there volume confirmation?
   - Are there news catalysts?
   - Identify risk flags

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
      "data_source": "coingecko | twitter | etc."
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

Be PRECISE. Don't say "positive sentiment" - say "15 bullish tweets vs 3 bearish = 83% positive".

Output ONLY valid JSON.`;

    let userPrompt = `User asked: "${userQuestion}"\n\n`;
    userPrompt += `Intent type: ${intent.intent_type}\n\n`;
    userPrompt += `Raw data from APIs:\n`;
    userPrompt += `${JSON.stringify(rawData, null, 2)}\n\n`;
    userPrompt += `Analyze this data and extract key insights. Output JSON only.`;
    
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",  // ⚡ 10x faster than gpt-4o
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1000  // Reduced for speed
      });
      
      const analysis = JSON.parse(completion.choices[0].message.content);
      console.log('✅ [Analyst Agent] Found', analysis.key_findings?.length || 0, 'key findings');
      
      return analysis;
      
    } catch (error) {
      console.error('❌ [Analyst Agent] Error:', error);
      return this.getFallbackAnalysis(rawData, userQuestion);
    }
  }
  
  filterForEcosystem(rawData, blockchain) {
    console.log(`🔍 [Analyst Agent] Filtering for ${blockchain} ecosystem (excluding native token)`);
    
    const filtered = JSON.parse(JSON.stringify(rawData)); // Deep copy
    
    // 🎯 DYNAMIC FILTERING - NO HARDCODING
    // Normalize blockchain name for comparison
    const blockchainNormalized = blockchain.toUpperCase();
    
    // Filter CoinGecko data to remove native blockchain token
    if (filtered.by_service?.coingecko) {
      filtered.by_service.coingecko = filtered.by_service.coingecko.map(data => {
        
        // Handle category markets format (array of coins directly)
        if (Array.isArray(data) && data.length > 0 && data[0].id) {
          const beforeCount = data.length;
          
          const filteredData = data.filter(coin => {
            const symbol = coin.symbol?.toUpperCase();
            const id = coin.id?.toLowerCase();
            const name = coin.name?.toUpperCase();
            
            // 🚫 EXCLUDE if symbol, id, or name matches the blockchain
            const isNativeToken = 
              symbol === blockchainNormalized ||
              name === blockchainNormalized ||
              symbol === blockchainNormalized.substring(0, 3) ||
              id?.includes(blockchain.toLowerCase()) ||
              name?.includes(blockchainNormalized);
            
            return !isNativeToken;
          });
          
          const afterCount = filteredData.length;
          console.log(`   Filtered ${beforeCount} → ${afterCount} tokens (removed ${beforeCount - afterCount})`);
          return filteredData;
        }
        
        // Handle trending format (nested coins array)
        if (data.coins) {
          const beforeCount = data.coins.length;
          
          data.coins = data.coins.filter(coinWrapper => {
            const coin = coinWrapper.item;
            const symbol = coin.symbol?.toUpperCase();
            const id = coin.id?.toLowerCase();
            const name = coin.name?.toUpperCase();
            const slug = coin.slug?.toLowerCase();
            
            const isNativeToken = 
              symbol === blockchainNormalized ||
              name === blockchainNormalized ||
              symbol === blockchainNormalized.substring(0, 3) ||
              id?.includes(blockchain.toLowerCase()) ||
              slug?.includes(blockchain.toLowerCase()) ||
              name?.includes(blockchainNormalized);
            
            return !isNativeToken;
          });
          
          const afterCount = data.coins.length;
          console.log(`   Filtered ${beforeCount} → ${afterCount} coins (removed ${beforeCount - afterCount})`);
        }
        
        return data;
      });
    }
    
    console.log(`✅ [Analyst Agent] Dynamically filtered out ${blockchain} native token`);
    
    return filtered;
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
