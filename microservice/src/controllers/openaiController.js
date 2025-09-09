import OpenAI from 'openai';
import { config } from '../config/config.js';
import { getSwapPrice, getSwapQuote } from './zeroXController.js';
import { TOKENS, resolveTokenStrict } from '../lib/tokens.js';
import { formatSwapFrom0x } from '../lib/quoteFormatter.js';
import { getAvailableTools, filterToolsForOpenAI } from '../lib/pluginManager.js';

export const ALLOWED_TOOLS = new Set(["getSwapPrice", "getSwapQuote", "executeSwap"]);
export const TOOL_POLICY_SYSTEM = `
You may only call: getSwapPrice, getSwapQuote, executeSwap.
Do NOT call CoinStats/Coingecko/etc.
Never invent prices or fees; only display values from 0x responses.
Always treat buyAmount/sellAmount as base units and convert with token decimals.
When user confirms a swap, call executeSwap to prepare the transaction data.
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
  const userAddress = functionArgs.userAddress || session?.walletAddress || undefined;
  return { chainId, userAddress };
}

export async function handleToolCall({ functionName, functionArgs, session, req }) {
  // Check if tool is available based on enabled plugins
  const availableTools = getAvailableTools(req);
  if (!availableTools.has(functionName)) {
    console.log(`🚫 Tool ${functionName} not available - plugin disabled`);
    return { status: 403, success: false, error: `Tool ${functionName} is not available (plugin disabled)` };
  }

  const { chainId, userAddress } = injectWalletContext(functionArgs, session);
  const cid = Number(chainId);

  // Resolve token infos for correct decimals
  const sellInfo = resolveTokenStrict(cid, functionArgs.sellToken);
  const buyInfo  = resolveTokenStrict(cid, functionArgs.buyToken);
  const chainLabel = cid === 1 ? "Ethereum" : cid === 8453 ? "Base (8453)" : `Chain ${cid}`;

  if (functionName === "getSwapPrice") {
    const raw = await callController(getSwapPrice, {
      sellToken: functionArgs.sellToken,
      buyToken: functionArgs.buyToken,
      sellAmount: functionArgs.sellAmountHuman || functionArgs.sellAmount,
      taker: userAddress,
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
    const raw = await callController(getSwapQuote, {
      sellToken: functionArgs.sellToken,
      buyToken: functionArgs.buyToken,
      sellAmount: functionArgs.sellAmountHuman || functionArgs.sellAmount,
      slippageBps: functionArgs.slippageBps ?? 50,
      taker: userAddress,
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
    console.log('🎯 userAddress:', userAddress, 'chainId:', cid);
    
    // For executeSwap, we need to get the quote with transaction data
    const raw = await callController(getSwapQuote, {
      sellToken: functionArgs.sellToken,
      buyToken: functionArgs.buyToken,
      sellAmount: functionArgs.sellAmountHuman || functionArgs.sellAmount,
      slippageBps: functionArgs.slippageBps ?? 50,
      taker: userAddress,
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
 * Create bubble data from tool call results
 */
function createBubbleDataFromTool(functionName, result) {
  if (!result.success || !result.data) {
    return null;
  }

  const bubbleId = Date.now() + Math.random();
  
  switch (functionName) {
    case 'getCoinData':
    case 'searchCoins':
    case 'getMarketData':
      return {
        type: 'coinstats',
        id: bubbleId,
        title: 'CoinStats - AI Data',
        content: formatCoinStatsData(result.data),
        loading: false,
        source: 'AI Tool Call'
      };
      
    case 'getTrendingCoins':
    case 'getCoinInsights':
      return {
        type: 'lurky',
        id: bubbleId,
        title: 'Lurky - AI Analytics',
        content: formatLurkyData(result.data),
        loading: false,
        source: 'AI Tool Call'
      };
      
    case 'getSwapPrice':
    case 'getSwapQuote':
      return {
        type: 'zerox',
        id: bubbleId,
        title: '0x Protocol - AI Swap',
        content: result.ui?.message || 'Swap data retrieved',
        loading: false,
        source: 'AI Tool Call',
        swapData: result.data
      };
      
    case 'getExchangeRate':
    case 'createTransaction':
      return {
        type: 'changenow',
        id: bubbleId,
        title: 'ChangeNOW - AI Exchange',
        content: formatChangeNowData(result.data),
        loading: false,
        source: 'AI Tool Call'
      };
      
    case 'getTokenBalances':
    case 'getTransactionHistory':
      return {
        type: 'alchemy',
        id: bubbleId,
        title: 'Alchemy - AI Blockchain Data',
        content: formatAlchemyData(result.data),
        loading: false,
        source: 'AI Tool Call'
      };
      
    default:
      return null;
  }
}

/**
 * Format CoinStats data for bubble display
 */
function formatCoinStatsData(data) {
  if (data.result && data.result.length > 0) {
    const coin = data.result[0];
    const change = coin.priceChange1d || 0;
    const changeDirection = change > 0 ? '+' : '';
    const price = coin.price > 1000 ? `${(coin.price/1000).toFixed(2)}k` : coin.price.toFixed(4);
    const marketCap = coin.marketCap ? `$${(coin.marketCap/1e9).toFixed(2)}B` : 'N/A';
    const volume = coin.volume ? `$${(coin.volume/1e6).toFixed(1)}M` : 'N/A';
    
    return `${coin.name} (${coin.symbol})\n\nPrice: $${price}\n24h: ${changeDirection}${change.toFixed(2)}%\nMarket Cap: ${marketCap}\nVolume: ${volume}\nRank: #${coin.rank || 'N/A'}`;
  }
  return 'Coin data retrieved by AI';
}

/**
 * Format Lurky data for bubble display  
 */
function formatLurkyData(data) {
  return 'Lurky analytics data retrieved by AI';
}

/**
 * Format ChangeNOW data for bubble display
 */
function formatChangeNowData(data) {
  return 'ChangeNOW exchange data retrieved by AI';
}

/**
 * Format Alchemy data for bubble display
 */
function formatAlchemyData(data) {
  return 'Alchemy blockchain data retrieved by AI';
}

/**
 * OpenAI Controller class
 */
export class OpenAIController {
  
  /**
   * Generate chat completion using OpenAI
   */
  static async generateChatCompletion(req, res) {
    try {
      const { messages, model = 'gpt-3.5-turbo', max_tokens = 1000, temperature = 0.7 } = req.body;

      console.log('📧 Messages Content --> ', messages); 

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

      // Define all available function tools for OpenAI
      const allTools = [
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
                userAddress: {
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
                userAddress: {
                  type: "string",
                  description: "User wallet address"
                }
              },
              required: ["sellToken", "buyToken", "sellAmount", "userAddress"]
            }
          }
        }
      ];

      // Filter tools based on enabled plugins
      const availableTools = filterToolsForOpenAI(req, allTools);

      // Make request to OpenAI with function calling tools
      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens,
        temperature,
        tools: availableTools,
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
              functionArgs,
              session: req.session, // Pass session for wallet context
              req // Pass request for plugin state checking
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
        
        // Check if any function results require wallet approval or bubble updates
        const walletTransactions = [];
        const bubbleUpdates = [];
        
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          const result = functionResults.find(fr => fr.tool_call_id === toolCall.id);
          
          if (result) {
            const parsedResult = JSON.parse(result.content);
            
            // Handle wallet transactions (existing logic)
            if (functionName === 'executeSwap' && parsedResult.walletTransaction) {
              walletTransactions.push(parsedResult.walletTransaction);
            }
            
            // Handle bubble updates (new logic)
            if (parsedResult.success && parsedResult.data) {
              const bubbleData = createBubbleDataFromTool(functionName, parsedResult);
              if (bubbleData) {
                bubbleUpdates.push(bubbleData);
              }
            }
          }
        }
        
        // Return final response with function results, wallet transactions, and bubble updates
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
            walletTransactions: walletTransactions.length > 0 ? walletTransactions : undefined,
            bubbleUpdates: bubbleUpdates.length > 0 ? bubbleUpdates : undefined
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
