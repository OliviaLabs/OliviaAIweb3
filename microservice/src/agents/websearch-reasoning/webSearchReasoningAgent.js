import OpenAI from 'openai';
import { config } from '../../config/config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

/**
 * WebSearch Reasoning Agent
 * 
 * Takes casual user input and converts it to optimized search queries,
 * executes real web searches via Perplexity AI, and prepares results
 * for the Reasoning Agent to process.
 */
export class WebSearchReasoningAgent {
  
  /**
   * Convert casual user query into optimized search query
   * 
   * @param {string} userMessage - Original user message
   * @param {object} understanding - Intent understanding from Reasoning Agent
   * @returns {Promise<object>} - { optimizedQuery, reasoning }
   */
  static async optimizeSearchQuery(userMessage, understanding = {}) {
    try {
      const today = new Date().toISOString().split('T')[0]; // e.g., "2025-10-13"
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      
      console.log('🔍 [WebSearch Reasoning] Optimizing query:', userMessage);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a search query optimizer for cryptocurrency news and information.

Today's date: ${today} (${dayOfWeek})

Your job: Convert casual user questions into precise, effective web search queries.

Rules:
1. Add temporal context: If user mentions "today", "this week", "this weekend", "recently" → add current date/month
2. Add crypto context: Always include "cryptocurrency" or "crypto" unless specific coin mentioned
3. Add intent keywords: Based on context, add "news", "market", "price", "crash", "rally", "analysis"
4. Keep concise: 5-10 words maximum
5. Return JSON ONLY, no markdown:

{
  "optimizedQuery": "the search query to use",
  "reasoning": "why you optimized it this way"
}

Examples:
User: "what happened this weekend to crypto" 
→ { "optimizedQuery": "cryptocurrency market news October 13 2025", "reasoning": "Added date context for 'this weekend' and 'crypto' keyword" }

User: "bitcoin"
→ { "optimizedQuery": "bitcoin price news today", "reasoning": "Added context for current info request" }

User: "why is eth crashing"
→ { "optimizedQuery": "ethereum crash reason October 2025", "reasoning": "Kept 'crash' intent, added date, expanded 'eth' to 'ethereum'" }

User: "tell me about solana"
→ { "optimizedQuery": "solana cryptocurrency news analysis 2025", "reasoning": "General info request needs news/analysis context" }`
          },
          {
            role: 'user',
            content: JSON.stringify({
              userMessage,
              userIntent: understanding.user_wants || 'unknown',
              tokens: understanding.entities_mentioned?.tokens || []
            })
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      });

      const content = response.choices[0]?.message?.content?.trim() || '{}';
      const parsed = JSON.parse(content);
      
      console.log('🧠 [WebSearch Reasoning] Optimized:', parsed.optimizedQuery);
      console.log('💭 [WebSearch Reasoning] Reasoning:', parsed.reasoning);
      
      return {
        optimizedQuery: parsed.optimizedQuery || userMessage,
        reasoning: parsed.reasoning || 'No optimization needed'
      };
      
    } catch (error) {
      console.error('❌ [WebSearch Reasoning] Error optimizing query:', error);
      return {
        optimizedQuery: userMessage,
        reasoning: 'Failed to optimize, using original query'
      };
    }
  }

  /**
   * Execute real web search using Perplexity AI
   * 
   * @param {string} searchQuery - Optimized search query
   * @returns {Promise<object>} - Search results with citations
   */
  static async executeWebSearch(searchQuery) {
    try {
      const perplexityKey = config.perplexityApiKey || process.env.PERPLEXITY_API_KEY;
      
      if (!perplexityKey) {
        console.warn('⚠️ [WebSearch] PERPLEXITY_API_KEY not set - using GPT fallback');
        return await this.fallbackGPTSearch(searchQuery);
      }

      console.log('🌐 [WebSearch] Executing Perplexity search:', searchQuery);

      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a cryptocurrency news search assistant. Provide factual, up-to-date information from web sources. Be concise and specific. Include dates and numbers when available.'
            },
            {
              role: 'user',
              content: searchQuery
            }
          ],
          max_tokens: 600,
          temperature: 0.2,
          return_citations: true
        })
      });

      if (!perplexityResponse.ok) {
        console.error('❌ [WebSearch] Perplexity API error:', perplexityResponse.status);
        return await this.fallbackGPTSearch(searchQuery);
      }

      const data = await perplexityResponse.json();
      const answer = data.choices[0]?.message?.content || 'No information found.';
      const citations = data.citations || [];

      console.log('✅ [WebSearch] Perplexity results received');
      console.log(`📚 [WebSearch] ${citations.length} citations found`);

      return {
        success: true,
        results: answer,
        citations: citations,
        source: 'perplexity',
        isRealTime: true
      };

    } catch (error) {
      console.error('❌ [WebSearch] Error:', error);
      return await this.fallbackGPTSearch(searchQuery);
    }
  }

  /**
   * Fallback to GPT when Perplexity unavailable
   */
  static async fallbackGPTSearch(searchQuery) {
    console.log('⚠️ [WebSearch] Using GPT fallback (NOT real-time)');
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '⚠️ IMPORTANT: You do NOT have real-time web access. Provide information from your training data, but ALWAYS start with "⚠️ Based on training data (not live web search):" to be transparent. Then provide what you know.'
          },
          {
            role: 'user',
            content: searchQuery
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const answer = response.choices[0]?.message?.content || 'No information available.';

      return {
        success: true,
        results: answer,
        citations: [],
        source: 'gpt-fallback',
        isRealTime: false
      };
    } catch (error) {
      console.error('❌ [WebSearch] Fallback error:', error);
      return {
        success: false,
        results: 'Unable to fetch search results.',
        citations: [],
        source: 'error',
        isRealTime: false
      };
    }
  }

  /**
   * Complete WebSearch reasoning flow:
   * 1. Optimize user query
   * 2. Execute web search
   * 3. Return enriched results for Reasoning Agent
   * 
   * @param {string} userMessage - User's original message
   * @param {object} understanding - Intent from Reasoning Agent
   * @returns {Promise<object>} - Complete search results
   */
  static async processWebSearch(userMessage, understanding = {}) {
    console.log('\n🔍 ============================================');
    console.log('🔍 [WebSearch Reasoning Agent] Starting...');
    console.log('🔍 ============================================');

    // STEP 1: Optimize search query
    const { optimizedQuery, reasoning } = await this.optimizeSearchQuery(userMessage, understanding);

    // STEP 2: Execute web search
    const searchResults = await this.executeWebSearch(optimizedQuery);

    // STEP 3: Return enriched data
    const enrichedResults = {
      originalQuery: userMessage,
      optimizedQuery: optimizedQuery,
      optimizationReasoning: reasoning,
      searchResults: searchResults.results,
      citations: searchResults.citations,
      source: searchResults.source,
      isRealTime: searchResults.isRealTime,
      success: searchResults.success,
      timestamp: new Date().toISOString()
    };

    console.log('✅ [WebSearch Reasoning Agent] Complete!');
    console.log(`📊 [WebSearch Reasoning Agent] Real-time: ${searchResults.isRealTime}`);
    console.log(`📚 [WebSearch Reasoning Agent] Citations: ${searchResults.citations.length}`);

    return enrichedResults;
  }
}

