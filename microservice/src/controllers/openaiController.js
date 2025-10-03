import OpenAI from 'openai';
import { config } from '../config/config.js';
import { getSwapPrice, getSwapQuote } from './zeroXController.js';
import { TOKENS, resolveTokenStrict } from '../lib/tokens.js';
import { formatSwapFrom0x } from '../lib/quoteFormatter.js';

export const ALLOWED_TOOLS = new Set(["getSwapPrice", "getSwapQuote", "executeSwap", "webSearch"]);
export const TOOL_POLICY_SYSTEM = `
You may call: getSwapPrice, getSwapQuote, executeSwap, webSearch.
For crypto prices and market data, use webSearch to get real-time information.
Never invent prices or fees; only display values from API responses.
Always treat buyAmount/sellAmount as base units and convert with token decimals.
When user confirms a swap, call executeSwap to prepare the transaction data.
Use webSearch for trending tokens, market analysis, and current crypto news.
`;

// Helper to call Express‑style controllers in‑process and capture JSON
async function callController(controller, query) {
  const mockReq = { query };
  return new Promise((resolve) => {
    const mockRes = {
      json: (data) => resolve(data),
      status: (code) => ({ json: (data) => resolve({ status: code, ...data }) }),
    };
    controller(mockReq, mockRes);
  });
}

function injectWalletContext(functionArgs, session) {
  const chainId = functionArgs.chainId || session?.walletChainId || 1;
  const taker = functionArgs.taker || session?.walletAddress || undefined;
  return { chainId, taker };
}

export async function handleToolCall({ functionName, functionArgs, session }) {
  if (!ALLOWED_TOOLS.has(functionName)) {
    return { status: 400, success: false, error: `Tool ${functionName} not allowed` };
  }

  // For webSearch, we don't need token resolution
  if (functionName === "webSearch") {
    console.log('🔍 webSearch called with args:', functionArgs);
    
    try {
      const searchQuery = functionArgs.query || functionArgs.searchQuery;
      if (!searchQuery) {
        return {
          success: false,
          error: 'Search query is required',
          message: 'Please provide a search query'
        };
      }

      const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      let searchResults = {
        query: searchQuery,
        results: []
      };

      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        searchResults.results = data.RelatedTopics.slice(0, 5).map((topic, index) => ({
          title: topic.Text || `Result ${index + 1}`,
          snippet: topic.Text || 'No description available',
          url: topic.FirstURL || '#'
        }));
      }

      return {
        success: true,
        data: searchResults,
        message: `I found information about "${searchQuery}". ${searchResults.results[0]?.snippet || 'No results found.'}`
      };
    } catch (error) {
      console.error('Web search error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to search the web. Please try again.'
      };
    }
  }

  const { chainId, taker } = injectWalletContext(functionArgs, session);
  const cid = Number(chainId);

  // Resolve token infos for correct decimals (only for trading functions)
  const sellInfo = resolveTokenStrict(cid, functionArgs.sellToken);
  const buyInfo  = resolveTokenStrict(cid, functionArgs.buyToken);
  const chainLabel = cid === 1 ? "Ethereum" : cid === 8453 ? "Base (8453)" : `Chain ${cid}`;

  if (functionName === "getSwapPrice") {
    const raw = await callController(getSwapPrice, {
      sellToken: functionArgs.sellToken,
      buyToken: functionArgs.buyToken,
      sellAmount: functionArgs.sellAmountHuman || functionArgs.sellAmount,
      taker: taker,
      chainId: cid
    });

    if (!raw?.success) return raw;
    const formatted = formatSwapFrom0x({
      quoteOrPrice: raw.data,
      sellInfo, buyInfo, chainLabel
    });

    return {
      success: true,
      data: raw.data,
      ui: formatted,                 // <- give the model + UI a safe, human string + numbers
      message: formatted.message     // <- use THIS as the assistant reply
    };
  }

  if (functionName === "getSwapQuote") {
    console.log('🔄 Calling getSwapQuote with params:', {
      sellToken: functionArgs.sellToken,
      buyToken: functionArgs.buyToken,
      sellAmount: functionArgs.sellAmountHuman || functionArgs.sellAmount,
      slippageBps: functionArgs.slippageBps ?? 50,
      taker: taker,
      chainId: cid
    });
    
    const raw = await callController(getSwapQuote, {
      sellToken: functionArgs.sellToken,
      buyToken: functionArgs.buyToken,
      sellAmount: functionArgs.sellAmountHuman || functionArgs.sellAmount,
      slippageBps: functionArgs.slippageBps ?? 50,
      taker: taker,
      chainId: cid
    });

    if (!raw?.success) return raw;
    const formatted = formatSwapFrom0x({
      quoteOrPrice: raw.data,
      sellInfo, buyInfo, chainLabel
    });

    return {
      success: true,
      data: raw.data,
      ui: formatted,
      message: formatted.message + "\n\nProceed with this quote?"
    };
  }

  if (functionName === "executeSwap") {
    console.log('🎯 executeSwap called with args:', functionArgs);
    console.log('🎯 taker:', taker, 'chainId:', cid);
    
    // For executeSwap, we need to get the quote with transaction data
    const raw = await callController(getSwapQuote, {
      sellToken: functionArgs.sellToken,
      buyToken: functionArgs.buyToken,
      sellAmount: functionArgs.sellAmountHuman || functionArgs.sellAmount,
      slippageBps: functionArgs.slippageBps ?? 50,
      taker: taker,
      chainId: cid
    });
    
    console.log('🎯 Raw response from getSwapQuote:', raw);

    if (!raw?.success) {
      return {
        success: false,
        error: "Failed to prepare swap transaction: " + (raw.error || "Unknown error"),
        message: "I apologize, but I couldn't prepare the swap transaction. Please try again or check your wallet connection."
      };
    }

    // Format the transaction data for the frontend
    const formatted = formatSwapFrom0x({
      quoteOrPrice: raw.data,
      sellInfo, buyInfo, chainLabel
    });

    const result = {
      success: true,
      data: raw.data,
      ui: formatted,
      transactionData: {
        to: raw.data.transaction?.to,
        data: raw.data.transaction?.data,
        value: raw.data.transaction?.value || '0',
        gasPrice: raw.data.transaction?.gasPrice,
        gas: raw.data.transaction?.gas
      },
      // Special flag to trigger wallet transaction
      requiresWalletApproval: true,
      walletAction: 'executeSwap',
      message: `🎯 **Swap Transaction Ready!**\n\n${formatted.message}\n\n**Next Step:** Please approve this transaction in your wallet to complete the swap.`
    };
    
    console.log('🎯 executeSwap returning:', result);
    return result;
  }

}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * OpenAI Controller class
 */
export class OpenAIController {
  
  /**
   * Generate chat completion using OpenAI
   */
  static async generateChatCompletion(req, res) {
    try {
      const { messages, model = 'gpt-4o', max_tokens = 2000, temperature = 0.7, taker, chainId, contextAwarenessData } = req.body;

      console.log('📧 Messages Content --> ', messages);
      console.log('🧠 Context Awareness Data --> ', contextAwarenessData); 

      // Validate required fields
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: 'Messages array is required and cannot be empty',
          code: 'INVALID_MESSAGES'
        });
      }

      // Validate message format
      const isValidMessages = messages.every(msg => 
        msg && typeof msg === 'object' && msg.role && msg.content
      );

      if (!isValidMessages) {
        return res.status(400).json({
          error: 'Each message must have "role" and "content" properties',
          code: 'INVALID_MESSAGE_FORMAT'
        });
      }

      // Check if OpenAI API key is configured
      if (!config.openaiApiKey || config.openaiApiKey === 'your_openai_api_key_here') {
        return res.status(500).json({
          error: 'OpenAI API key is not configured',
          code: 'OPENAI_NOT_CONFIGURED'
        });
      }

      // Define trading function tools for OpenAI
      const tradingTools = [
        {
          type: "function",
          function: {
            name: "webSearch",
            description: "Search the web for real-time cryptocurrency information ONLY if the context data doesn't already have the answer",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for cryptocurrency information"
                }
              },
              required: ["query"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getSwapQuote",
            description: "Get swap quote from 0x Protocol for token trading",
            parameters: {
              type: "object",
              properties: {
                sellToken: {
                  type: "string",
                  description: "Token to sell (symbol or address)"
                },
                buyToken: {
                  type: "string", 
                  description: "Token to buy (symbol or address)"
                },
                sellAmount: {
                  type: "string",
                  description: "Amount to sell (in token units)"
                },
                taker: {
                  type: "string",
                  description: "User wallet address"
                }
              },
              required: ["sellToken", "buyToken", "sellAmount"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getSwapPrice",
            description: "Get swap price estimate from 0x Protocol (lighter than quote)",
            parameters: {
              type: "object",
              properties: {
                sellToken: {
                  type: "string",
                  description: "Token to sell (symbol or address)"
                },
                buyToken: {
                  type: "string",
                  description: "Token to buy (symbol or address)"
                },
                sellAmount: {
                  type: "string", 
                  description: "Amount to sell (in token units)"
                }
              },
              required: ["sellToken", "buyToken", "sellAmount"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "executeSwap",
            description: "Execute token swap transaction using 0x Protocol",
            parameters: {
              type: "object",
              properties: {
                sellToken: {
                  type: "string",
                  description: "Token to sell (symbol or address)"
                },
                buyToken: {
                  type: "string",
                  description: "Token to buy (symbol or address)"
                },
                sellAmount: {
                  type: "string",
                  description: "Amount to sell (in token units)"
                },
                taker: {
                  type: "string",
                  description: "User wallet address"
                }
              },
              required: ["sellToken", "buyToken", "sellAmount", "taker"]
            }
          }
        }
      ];

      // Format context data in a clean, readable way
      const formatContextData = (data) => {
        if (!data || Object.keys(data).length === 0) return 'No context data available.';
        
        let formatted = '';
        
        // CoinGecko Price Data
        if (data.coingecko_price_data) {
          const coin = data.coingecko_price_data;
          formatted += `📊 COINGECKO PRICE DATA:\n${coin.content || coin.token}\n\n`;
        }
        
        // Twitter Data with SENTIMENT ANALYSIS
        if (data.twitter_data && data.twitter_data.tweets) {
          const tweets = Array.isArray(data.twitter_data.tweets) ? data.twitter_data.tweets : [];
          formatted += `🐦 TWITTER SENTIMENT ANALYSIS (${tweets.length} tweets):\n`;
          
          // Analyze sentiment
          const bullishKeywords = ['bullish', 'moon', 'pump', 'buy', 'long', 'up', 'breakout', 'resistance', 'support'];
          const bearishKeywords = ['bearish', 'dump', 'sell', 'short', 'down', 'crash', 'rug'];
          
          let bullishCount = 0;
          let bearishCount = 0;
          
          tweets.forEach(tweet => {
            // Handle both string and object formats
            const tweetText = typeof tweet === 'string' ? tweet : (tweet.text || tweet.content || JSON.stringify(tweet));
            const lower = tweetText.toLowerCase();
            if (bullishKeywords.some(word => lower.includes(word))) bullishCount++;
            if (bearishKeywords.some(word => lower.includes(word))) bearishCount++;
          });
          
          formatted += `SENTIMENT: ${bullishCount} bullish, ${bearishCount} bearish (${tweets.length} total)\n`;
          formatted += `SIGNAL: ${bullishCount > bearishCount * 2 ? '🟢 STRONG BULLISH' : bullishCount > bearishCount ? '🟡 MODERATELY BULLISH' : bearishCount > bullishCount ? '🔴 BEARISH' : '⚪ NEUTRAL'}\n\n`;
          
          formatted += 'TOP TWEETS:\n';
          tweets.slice(0, 8).forEach((tweet, i) => {
            // Handle both string and object formats
            const tweetText = typeof tweet === 'string' ? tweet : (tweet.text || tweet.content || JSON.stringify(tweet));
            formatted += `${i+1}. ${tweetText}\n`;
          });
          formatted += '\n';
        }
        
        // CryptoPanic News
        if (data.websearch_articles && data.websearch_articles.length > 0) {
          formatted += `📰 NEWS CATALYST ANALYSIS (${data.websearch_articles.length} articles):\n`;
          data.websearch_articles.slice(0, 5).forEach((article, i) => {
            formatted += `${i+1}. ${article.title} (${article.source})\n`;
            if (article.votes) {
              const sentiment = article.votes.positive > article.votes.negative ? '🟢 Positive' : '🔴 Negative';
              formatted += `   Votes: ${sentiment} (+${article.votes.positive}/-${article.votes.negative})\n`;
            }
          });
          formatted += '\n';
        }
        
        // CoinStats Data with VOLUME ANALYSIS
        if (data.coinstats_data) {
          const cs = data.coinstats_data;
          formatted += `💹 COINSTATS METRICS:\n`;
          formatted += `Price: $${cs.price} | Change: ${cs.change24h > 0 ? '+' : ''}${cs.change24h}%\n`;
          formatted += `Market Cap: $${(cs.marketCap / 1e6).toFixed(2)}M | Volume: $${(cs.volume / 1e6).toFixed(2)}M\n`;
          formatted += `Rank: #${cs.rank || 'N/A'}\n\n`;
        }
        
        // Lurky Social Data
        if (data.lurky_data && data.lurky_data.social_data) {
          formatted += `💬 LURKY SOCIAL INTELLIGENCE:\n`;
          const social = data.lurky_data.social_data;
          if (social.coins && social.coins[0]) {
            const coin = social.coins[0];
            if (coin.mentions) {
              formatted += `Bullish Mentions: ${coin.mentions.bullish || 0}\n`;
              formatted += `Bearish Mentions: ${coin.mentions.bearish || 0}\n`;
              formatted += `Neutral: ${coin.mentions.neutral || 0}\n`;
              formatted += `Overall Sentiment: ${coin.mentions.overall_sentiment || 'Unknown'}\n`;
            }
          }
          formatted += '\n';
        }
        
        // Portfolio Data with P&L ANALYSIS
        if (data.portfolio_data && data.portfolio_data.tokens) {
          formatted += `💰 USER PORTFOLIO ANALYSIS:\n`;
          formatted += `Total Tokens: ${data.portfolio_data.tokens.length}\n`;
          formatted += `Total Value: $${data.portfolio_data.total_value?.toFixed(2) || 'N/A'}\n\n`;
          
          // Check if user holds the token being discussed
          const activeSymbol = data.active_token?.symbol?.toUpperCase();
          if (activeSymbol) {
            const holding = data.portfolio_data.tokens.find(t => 
              t.symbol?.toUpperCase() === activeSymbol
            );
            if (holding) {
              formatted += `🎯 USER HOLDS THIS TOKEN:\n`;
              formatted += `Amount: ${holding.balance} ${holding.symbol}\n`;
              formatted += `Value: $${holding.value?.toFixed(2) || 'N/A'}\n`;
              formatted += `🔥 USE THIS FOR PERSONALIZED INSIGHTS!\n\n`;
            }
          }
        }
        
        return formatted;
      };
      
      // Build system message with context awareness data
      const systemMessage = {
        role: "system",
        content: `You are Olivia - a high-precision crypto analyst powered by 21 live data feeds.

DATA PRIORITY:
1. ALWAYS use contextAwarenessData below - it's already fetched from 21 APIs
2. Never invent data - if missing, state "Data not available for X"
3. Only call webSearch if context genuinely lacks critical information

RESPONSE STRUCTURE (use this format for every answer):

📊 ANALYSIS
- State: Current price, 24h change, volume, market cap
- Signal: Pre-calculated sentiment from data (🟢/🟡/🔴)

💬 SOCIAL PROOF (quote 2-3 actual tweets verbatim)
- @username: "exact tweet text"

✅ VALIDATION
- Cross-check: Does price action match sentiment? Volume legitimate?
- Pattern: Pump/dump/reversal/consolidation?

💰 YOUR POSITION (if user holds this token)
- Holdings: Amount + current value
- P&L: How much gained/lost today

🎯 ACTION PLAN
- What should they do? (Hold/Buy/Sell/Watch)
- Specific targets and stop losses
- Risk warnings

${contextAwarenessData && Object.keys(contextAwarenessData).length > 0 ? `
═══════════════════════════════════════════════════════
📊 LIVE INTELLIGENCE FEED (21 APIs):
═══════════════════════════════════════════════════════

${formatContextData(contextAwarenessData)}

═══════════════════════════════════════════════════════
🧠 ANALYSIS FRAMEWORK - Think like a professional analyst:
═══════════════════════════════════════════════════════

CRITICAL RULES:
1. Quote tweets verbatim with @username: "exact text"
2. Use exact numbers: "$0.1274" not "around 12 cents"
3. Show pre-calculated sentiment from data
4. Cross-validate: Price action vs Sentiment vs Volume
5. If user holds token, show P&L and personalized advice
6. Be direct, professional, actionable

VALIDATION PATTERNS:
- Price ↑ + Bullish sentiment + High volume = ✅ LEGITIMATE PUMP
- Price ↑ + Bearish sentiment + Low volume = ⚠️ SUSPICIOUS
- Price ↓ + Bullish sentiment + High volume = 🔄 REVERSAL SETUP
- Price ↑ + No tweets/news = 🤔 INVESTIGATE

STYLE:
- Direct and professional
- Use emojis for visual clarity (📊💬✅💰🎯)
- Max 12 sentences for simple queries, more for complex analysis
- Always end with actionable next steps

EXAMPLES OF EXCEPTIONAL RESPONSES:

User: "why is CORN pumping?"

YOU:
📊 ANALYSIS
CORN at $0.1274, up 5.48% with $4.8M volume (market cap $66.7M)
Twitter sentiment: 🟢 STRONG BULLISH (15 bullish vs 2 bearish from 20 tweets)

💬 SOCIAL PROOF
- @crypto_hunter: "CORN breaking key resistance at $0.12, could run to $0.15"
- @defi_degen: "Smart money accumulating CORN, check the volume"
- @chart_master: "Perfect cup and handle forming on 4h chart"

✅ VALIDATION
Pattern: ✅ LEGITIMATE PUMP (Price ↑ + Bullish sentiment + Volume +40%)
The social buzz aligns with price action. Volume spike suggests real demand, not manipulation.

💰 YOUR POSITION
You hold 1,000 CORN worth $127.40
Today's 5.48% pump added $6.97 to your position

🎯 ACTION PLAN
- HOLD current position
- Take partial profit at $0.15 (next resistance from tweets)
- Stop loss at $0.11 (protects your gains)
- Watch: If volume drops below $3M, momentum fading
⚠️ Small cap = high volatility. Can pump to $0.15 or dump to $0.10 quickly."

User: "should I buy?"

YOU:
📊 ANALYSIS
You already hold 1,000 CORN ($127.40). Analyzing if you should ADD:
Current: $0.1274, up 5.48%, volume $4.8M (+40%)
Sentiment: 🟢 STRONG BULLISH

💬 SOCIAL PROOF
Already covered above - breaking $0.12 resistance per tweets

✅ VALIDATION
⚠️ LATE ENTRY RISK: Already pumped 5.48%
✅ Volume confirms legitimacy
❌ Chasing momentum after pump = higher risk

💰 YOUR POSITION
Current holdings: 1,000 CORN = $127.40
Today's gain: +$6.97
Exposure level: Already invested

🎯 ACTION PLAN
DON'T ADD NOW - you're already exposed
Better strategy:
1. HOLD current position, set take-profit at $0.14-$0.15
2. Only add if price consolidates above $0.12 for 2-4 hours
3. Or wait for pullback to $0.11-$0.115
4. Stop loss: $0.11 (protects existing gains)

⚠️ Adding here = chasing. You're already in profit. Don't get greedy."

NOW ANALYZE THE DATA ABOVE WITH THIS LEVEL OF DEPTH.
` : 'No live data available. Provide general crypto knowledge only.'}

Think like a professional. Connect the dots. Be insightful.`
      };

      // Prepend system message to conversation
      const messagesWithContext = [systemMessage, ...messages];
      
      // Log what we're sending to OpenAI
      console.log('Sending to OpenAI - Message count:', messagesWithContext.length);
      console.log('Full conversation being sent:');
      messages.forEach((m, i) => {
        console.log(`  [${i}] ${m.role}: ${m.content}`);
      });
      console.log('Context data keys:', Object.keys(contextAwarenessData || {}));

      // Make request to OpenAI with function calling tools
      const completion = await openai.chat.completions.create({
        model,
        messages: messagesWithContext,
        max_tokens,
        temperature,
        tools: tradingTools,
        tool_choice: "auto" // Let AI decide when to use tools
      });

      // Check if AI wants to call functions
      const message = completion.choices[0].message;
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log('🔧 AI wants to call functions:', message.tool_calls);
        
        // Execute function calls
        const functionResults = [];
        
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`🚀 Executing function: ${functionName}`, functionArgs);
          
          try {
            // Use the new handleToolCall function with proper formatting
            const result = await handleToolCall({
              functionName,
              functionArgs: {
                ...functionArgs,
                taker: taker || functionArgs.taker,
                chainId: chainId || functionArgs.chainId
              },
              session: {
                ...req.session,
                walletAddress: taker || req.session?.walletAddress,
                walletChainId: chainId || req.session?.walletChainId
              }
            });
            
            // Special handling for executeSwap - trigger wallet transaction
            if (functionName === 'executeSwap') {
              if (result.success && result.requiresWalletApproval) {
                // Send transaction data directly to frontend via response
                result.executionReady = true;
                result.message = result.message + "\n\nTransaction data is ready. Please confirm in your wallet.";
                result.instructions = "The transaction data is ready. Please ask the user to confirm the swap in their connected wallet.";
                
                // Include transaction data in the response that will be sent to frontend
                result.walletTransaction = {
                  action: 'executeSwap',
                  transactionData: result.transactionData,
                  requiresApproval: true
                };
                
                console.log('🎯 Transaction data prepared for wallet:', result.walletTransaction);
              }
            }
            
            functionResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              content: JSON.stringify(result)
            });
            
          } catch (error) {
            console.error(`Function execution failed: ${functionName}`, error);
            functionResults.push({
              tool_call_id: toolCall.id,
              role: "tool", 
              content: JSON.stringify({ error: error.message })
            });
          }
        }
        
        // Send function results back to OpenAI for final response
        const followUpMessages = [
          ...messages,
          message, // AI's function call message
          ...functionResults // Function results
        ];
        
        // Add instruction to avoid emojis in final response
        const finalMessages = [
          {
            role: "system",
            content: "Keep responses clean and professional without emojis. Present trading information clearly and concisely."
          },
          ...followUpMessages
        ];
        
        const finalCompletion = await openai.chat.completions.create({
          model,
          messages: finalMessages,
          max_tokens,
          temperature
        });
        
        // Check if any function results require wallet approval
        const walletTransactions = [];
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          if (functionName === 'executeSwap') {
            // Find the corresponding result
            const result = functionResults.find(fr => fr.tool_call_id === toolCall.id);
            if (result) {
              const parsedResult = JSON.parse(result.content);
              if (parsedResult.walletTransaction) {
                walletTransactions.push(parsedResult.walletTransaction);
              }
            }
          }
        }
        
        // Return final response with function results and wallet transactions
        res.json({
          success: true,
          data: {
            id: finalCompletion.id,
            object: finalCompletion.object,
            created: finalCompletion.created,
            model: finalCompletion.model,
            choices: finalCompletion.choices,
            usage: finalCompletion.usage,
            function_calls_executed: message.tool_calls.length,
            walletTransactions: walletTransactions.length > 0 ? walletTransactions : undefined
          }
        });
        
      } else {
        // No function calls, return normal response
        res.json({
          success: true,
          data: {
            id: completion.id,
            object: completion.object,
            created: completion.created,
            model: completion.model,
            choices: completion.choices,
            usage: completion.usage
          }
        });
      }

    } catch (error) {
      console.error('OpenAI API Error:', error);

      // Handle OpenAI specific errors
      if (error.status) {
        return res.status(error.status).json({
          error: error.message,
          code: 'OPENAI_API_ERROR',
          details: error.type
        });
      }

      // Handle general errors
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Health check for the OpenAI service
   */
  static async healthCheck(req, res) {
    try {
      // Simple health check - verify OpenAI client is configured
      const isConfigured = config.openaiApiKey && config.openaiApiKey !== 'your_openai_api_key_here';
      
      res.json({
        success: true,
        service: 'OpenAI Microservice',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        openai_configured: isConfigured
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        service: 'OpenAI Microservice',
        status: 'unhealthy',
        error: error.message
      });
    }
  }

  /**
   * Extract trading parameters from natural language using function calling
   */
  static async extractTradingParameters(req, res) {
    try {
      const { input } = req.body;

      // Validate required fields
      if (!input || typeof input !== 'string') {
        return res.status(400).json({
          error: 'Input text is required and must be a string',
          code: 'INVALID_INPUT'
        });
      }

      // Check if OpenAI API key is configured
      if (!config.openaiApiKey || config.openaiApiKey === 'your_openai_api_key_here') {
        return res.status(500).json({
          error: 'OpenAI API key is not configured',
          code: 'OPENAI_NOT_CONFIGURED'
        });
      }

      // Define the function schema for extracting trading parameters
      const tradingExtractionTool = {
        type: "function",
        function: {
          name: "extract_trading_parameters",
          description: "Extracts trading parameters from user input for cryptocurrency trading operations",
          parameters: {
            type: "object",
            properties: {
              from_currency: {
                type: "string",
                description: "The currency or asset the user wants to swap from (e.g., USD, BTC, ETH)"
              },
              to_currency: {
                type: "string", 
                description: "The currency or asset the user wants to swap to (e.g., TON, BTC, ETH)"
              },
              amount: {
                type: "number",
                description: "The amount to swap. If not specified, this should be null"
              },
              operation_type: {
                type: "string",
                enum: ["buy", "sell", "swap", "trade"],
                description: "The type of trading operation the user wants to perform"
              }
            },
            required: ["from_currency", "to_currency", "operation_type"]
          }
        }
      };

      // Make request to OpenAI with function calling
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a cryptocurrency trading assistant. Extract trading parameters from user requests. Always identify the currencies they want to trade between and the operation type."
          },
          {
            role: "user",
            content: input
          }
        ],
        tools: [tradingExtractionTool],
        tool_choice: "required"
      });

      // Extract the function call result
      const message = completion.choices[0].message;
      
      if (!message.tool_calls || message.tool_calls.length === 0) {
        return res.status(400).json({
          error: 'Could not extract trading parameters from input',
          code: 'EXTRACTION_FAILED'
        });
      }

      const toolCall = message.tool_calls[0];
      const extractedParams = JSON.parse(toolCall.function.arguments);

      // Set default amount to 1 if not specified
      if (!extractedParams.amount || extractedParams.amount === null) {
        extractedParams.amount = 1;
      }

      // Return successful response with extracted parameters
      res.json({
        success: true,
        data: {
          original_input: input,
          extracted_parameters: extractedParams,
          function_call_id: toolCall.id,
          openai_response: {
            id: completion.id,
            model: completion.model,
            usage: completion.usage
          }
        }
      });

    } catch (error) {
      console.error('Trading Parameter Extraction Error:', error);

      // Handle OpenAI specific errors
      if (error.status) {
        return res.status(error.status).json({
          error: error.message,
          code: 'OPENAI_API_ERROR',
          details: error.type
        });
      }

      // Handle JSON parsing errors
      if (error.name === 'SyntaxError') {
        return res.status(500).json({
          error: 'Failed to parse extracted parameters',
          code: 'PARSE_ERROR'
        });
      }

      // Handle general errors
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get available models (for testing purposes)
   */
  static async getModels(req, res) {
    try {
      if (!config.openaiApiKey || config.openaiApiKey === 'your_openai_api_key_here') {
        return res.status(500).json({
          error: 'OpenAI API key is not configured',
          code: 'OPENAI_NOT_CONFIGURED'
        });
      }

      const models = await openai.models.list();
      
      res.json({
        success: true,
        data: models.data
      });
    } catch (error) {
      console.error('OpenAI Models Error:', error);
      
      if (error.status) {
        return res.status(error.status).json({
          error: error.message,
          code: 'OPENAI_API_ERROR'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get token information from the authenticated JWT
   */
  static async getTokenInfo(req, res) {
    try {
      // Token info is attached by the auth middleware
      if (!req.tokenInfo) {
        return res.status(401).json({
          error: 'No token information available',
          code: 'NO_TOKEN_INFO'
        });
      }

      res.json({
        success: true,
        message: 'Token information retrieved successfully',
        data: req.tokenInfo
      });
    } catch (error) {
      console.error('Token Info Error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}
