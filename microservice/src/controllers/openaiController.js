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
      const { messages, model = 'gpt-3.5-turbo', max_tokens = 1000, temperature = 0.7, taker, chainId, contextAwarenessData } = req.body;

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
            description: "Search the web for real-time cryptocurrency information, prices, trends, and news",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for cryptocurrency information, prices, trends, or news"
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

      // Build system message with context awareness data
      const systemMessage = {
        role: "system",
        content: `You are Olivia, a helpful cryptocurrency AI assistant. You have access to real-time market data from various sources.

${contextAwarenessData ? `
REAL-TIME MARKET CONTEXT:
${JSON.stringify(contextAwarenessData, null, 2)}

Use this data to provide accurate, informed responses. When users ask about prices, trends, or market data, reference this context directly.
` : ''}

Keep responses natural, conversational, and helpful. Avoid emojis unless they add value.`
      };

      // Prepend system message to conversation
      const messagesWithContext = [systemMessage, ...messages];
      
      // Log what we're sending to OpenAI
      console.log('Sending to OpenAI - Message count:', messagesWithContext.length);
      console.log('Conversation:', messages.map(m => `${m.role}: ${m.content.substring(0, 50)}...`));

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
        model: "gpt-4",
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
