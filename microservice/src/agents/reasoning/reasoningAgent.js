import OpenAI from 'openai';
import { config } from '../../config/config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

/**
 * Reasoning Agent
 * Understands user intent and determines what data is needed
 */
export class ReasoningAgent {
  
  /**
   * Analyze user message to understand intent
   * @param {string} userMessage - The user's question
   * @param {object} conversationHistory - Previous messages
   * @param {object} userContext - User context with plugin data
   * @returns {Promise<object>} Intent analysis
   */
  static async analyzeIntent(userMessage, conversationHistory = [], userContext = {}) {
    console.log('🧠 [Reasoning Agent] Analyzing user intent...');
    
    // Build context summary for prompt
    let contextSummary = '\n\nAVAILABLE CACHED DATA (already loaded by plugins):\n';
    if (userContext.tonCenterData?.popular_jettons) {
      contextSummary += '✅ TON blockchain data (popular jettons)\n';
    }
    if (userContext.twitterData?.tweets) {
      contextSummary += `✅ Twitter sentiment (${userContext.twitterData.tweets.length} tweets)\n`;
    }
    if (userContext.marketData) {
      contextSummary += `✅ Market price data (${Object.keys(userContext.marketData).length} tokens)\n`;
    }
    if (userContext.portfolioData?.tokens) {
      contextSummary += `✅ User portfolio (${userContext.portfolioData.tokens.length} tokens)\n`;
    }
    if (userContext.coingeckoData) {
      contextSummary += '✅ CoinGecko price data\n';
    }
    if (userContext.coinStatsData) {
      contextSummary += '✅ CoinStats data\n';
    }
    if (userContext.blockchainData) {
      contextSummary += '✅ Blockchain data\n';
    }
    if (userContext.exchangeData) {
      contextSummary += '✅ Exchange data\n';
    }
    
    if (contextSummary === '\n\nAVAILABLE CACHED DATA (already loaded by plugins):\n') {
      contextSummary = '\n\nNo cached data available yet (plugins haven\'t loaded data).\n';
    }
    
    try {
      // Define structured intent extraction tool
      const intentTool = {
        type: "function",
        function: {
          name: "extract_intent",
          description: "Extracts user intent, required data types, and entities from the user message with full conversation context",
          parameters: {
            type: "object",
            properties: {
              user_wants: {
                type: "string",
                description: "In your own words, what does the user actually want?"
              },
              to_answer_need: {
                type: "array",
                items: { type: "string" },
                description: "List of data types needed (price, volume, marketCap, trending, news, sentiment, portfolio, swapQuote, blockchainData, kols)"
              },
              entities_mentioned: {
                type: "object",
                properties: {
                  tokens: {
                    type: "array",
                    items: { type: "string" },
                    description: "Any tokens/coins mentioned"
                  },
                  blockchains: {
                    type: "array",
                    items: { type: "string" },
                    description: "Any blockchains/chains mentioned"
                  },
                  other: {
                    type: "array",
                    items: { type: "string" },
                    description: "Any other relevant entities"
                  }
                },
                required: ["tokens", "blockchains", "other"]
              },
              urgency: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Is this time-sensitive?"
              },
              reasoning: {
                type: "string",
                description: "Why you chose these data types"
              },
              is_follow_up: {
                type: "boolean",
                description: "Is this a follow-up to the previous answer?"
              },
              continuation_context: {
                type: "string",
                description: "If follow-up: what was the previous topic/entities they were asking about?"
              }
            },
            required: ["user_wants", "to_answer_need", "entities_mentioned", "urgency", "reasoning"]
          }
        }
      };

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent reasoning agent that deeply understands what users want AND conversation context.

YOUR JOB:
1. Understand the user's question in natural language AND its relationship to previous conversation
2. Identify what information would answer their question
3. Determine which types of data are needed
4. CHECK if cached data already exists - if it does, mark it as "cached" instead of "needed"
5. **CRITICAL**: Understand follow-up questions like "what other ones?", "more", "others" - these mean user wants MORE from the SAME dataset

CONVERSATION INTELLIGENCE (CRITICAL):
- If user asks "what other ones?", "more?", "others?" after getting a list → they want MORE items from the SAME dataset
- Look at conversation history to understand what was JUST discussed
- Identify the SAME entities (blockchain, token, etc.) they're still asking about
- Request the SAME data type but indicate it's a CONTINUATION
- Example: 
  * User: "What's pumping on TON?" → trending data for TON
  * User: "What other ones?" → SAME trending data for TON (user wants to see more tokens from that list)

THINK ABOUT:
- What is the user really asking?
- Is this a NEW question or a FOLLOW-UP to the previous answer?
- If follow-up: What were they just asking about? (check conversation history)
- What specific information do they need?
- What context would help answer this?
- Is this urgent or casual?
- DO WE ALREADY HAVE THIS DATA? (check cached data below)

${contextSummary}

IMPORTANT: If data exists in cached data above, you may not need to request it again! But for follow-ups, request it anyway so Frontend Agent can show MORE items.

AVAILABLE DATA TYPES:
- price: Current token prices
- volume: Trading volume
- marketCap: Market capitalization
- trending: What's popular/moving
- news: Recent news/announcements
- sentiment: Community opinions/social data
- portfolio: User's wallet/holdings
- swapQuote: Token exchange rates
- blockchainData: Which blockchain/chain a token is on, platform info, network data, on-chain metrics
- kols: Influencer/KOL opinions

STRATEGY: Request ALL data types that could provide valuable insights, not just the obvious ones. Be comprehensive in your data requests to ensure the AI has maximum context for analysis.

Be intelligent. Understand nuance. Track conversation flow. Recognize follow-ups.`
          },
          ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userMessage
          }
        ],
        tools: [intentTool],
        tool_choice: "required",
        temperature: 0.3,
        max_tokens: 500
      });

      const message = response.choices[0].message;
      const toolCall = message.tool_calls?.[0];
      
      if (!toolCall) {
        console.warn('🧠 [Reasoning Agent] No tool call returned, using fallback');
        return {
          user_wants: 'General crypto information',
          to_answer_need: ['price', 'trending'],
          entities_mentioned: { tokens: [], blockchains: [], other: [] },
          urgency: 'medium',
          reasoning: 'Fallback - no tool call returned',
          is_follow_up: false,
          continuation_context: ''
        };
      }

      const intentAnalysis = JSON.parse(toolCall.function.arguments);
      
      // Ensure entities_mentioned has all required fields
      if (!intentAnalysis.entities_mentioned) {
        intentAnalysis.entities_mentioned = { tokens: [], blockchains: [], other: [] };
      }
      if (!intentAnalysis.entities_mentioned.tokens) {
        intentAnalysis.entities_mentioned.tokens = [];
      }
      if (!intentAnalysis.entities_mentioned.blockchains) {
        intentAnalysis.entities_mentioned.blockchains = [];
      }
      if (!intentAnalysis.entities_mentioned.other) {
        intentAnalysis.entities_mentioned.other = [];
      }
      
      console.log('🧠 [Reasoning Agent] tool_call: extract_intent', {
        userWants: intentAnalysis.user_wants,
        needsData: intentAnalysis.to_answer_need,
        entities: intentAnalysis.entities_mentioned,
        urgency: intentAnalysis.urgency,
        isFollowUp: intentAnalysis.is_follow_up || false
      });
      
      return intentAnalysis;
      
    } catch (error) {
      console.error('🧠 [Reasoning Agent] Error:', error);
      
      // Safe fallback: basic understanding
      return {
        user_wants: 'General crypto information',
        to_answer_need: ['price', 'trending'],
        entities_mentioned: { tokens: [], blockchains: [], other: [] },
        urgency: 'medium',
        reasoning: 'Fallback - error in intent extraction',
        is_follow_up: false,
        continuation_context: ''
      };
    }
  }

  /**
   * Filter and prioritize data before sending to frontend
   * @param {object} rawData - Raw data from APIs
   * @param {object} understanding - User understanding from analyzeIntent
   * @returns {object} Filtered, prioritized data
   */
  static filterData(rawData, understanding) {
    console.log('🧠 [Reasoning Agent] Filtering data based on what user needs...');
    
    const filtered = {};
    const needed = understanding.to_answer_need || [];
    
    // Dynamically include only data types that were identified as needed
    const dataTypeMap = {
      'price': 'priceData',
      'volume': 'volumeData', 
      'marketCap': 'marketCapData',
      'trending': 'trendingData',
      'news': 'newsData',
      'sentiment': 'sentimentData',
      'portfolio': 'portfolioData',
      'swapQuote': 'swapData',
      'blockchainData': 'blockchainData',
      'kols': 'kolsData'
    };
    
    // Include ALL successfully fetched data for comprehensive analysis
    Object.entries(rawData).forEach(([key, value]) => {
      if (value && Object.keys(value).length > 0) {
        filtered[key] = value;
      }
    });
    
    // Also include needed data for backward compatibility
    needed.forEach(dataType => {
      const rawDataKey = dataTypeMap[dataType];
      if (rawDataKey && rawData[rawDataKey]) {
        filtered[rawDataKey] = rawData[rawDataKey];
      }
    });
    
    console.log('🧠 [Reasoning Agent] Filtered data keys:', Object.keys(filtered));
    console.log('🧠 [Reasoning Agent] Reasoning:', understanding.reasoning);
    
    return {
      filtered,
      userIntent: understanding.user_wants,
      reasoning: understanding.reasoning,
      urgency: understanding.urgency,
      dataSources: Object.keys(filtered).length // Track how many data sources we have
    };
  }
}

