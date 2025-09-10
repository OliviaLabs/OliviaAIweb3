import OpenAI from 'openai';
import { config } from '../config/config.js';
import { getSwapPrice, getSwapQuote, getWalletBalance } from './zeroXController.js';
import { TOKENS, resolveTokenStrict } from '../lib/tokens.js';
import { formatSwapFrom0x } from '../lib/quoteFormatter.js';
import { getAvailableTools, filterToolsForOpenAI } from '../lib/pluginManager.js';
import { needsAllowance, hasInsufficientBalance } from '../lib/allowanceChecker.js';
import { createTxEnvelope } from '../types/transaction.js';

// Helper function to convert human-readable amounts to base units
function toBaseUnits(human, decimals) {
  const humanStr = String(human).trim().replace(/^\+/, '');
  
  // Validate decimal format
  if (!/^\d*(\.\d*)?$/.test(humanStr)) {
    throw new Error('Invalid decimal amount');
  }
  
  // Split into integer and fraction parts
  const [iRaw, fRaw = ""] = humanStr.includes('.') ? humanStr.split('.') : [humanStr, ""];
  
  // Normalize integer part (remove leading zeros but keep at least one)
  const integer = iRaw === "" ? "0" : iRaw.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fRaw;
  
  // Pad or truncate fraction to match decimals
  const frac = (fraction + "0".repeat(decimals)).slice(0, decimals);
  
  // Combine integer and fraction parts
  const baseUnitsStr = integer + (decimals ? frac : "");
  
  // Use BigInt to ensure no precision loss
  return BigInt(baseUnitsStr || "0").toString();
}

// Cache for recent quotes to avoid re-quoting on confirmation
const lastQuoteCache = new Map(); // key: `${taker}|${chainId}|${sellToken}|${buyToken}|${sellAmountBase}`
// Cache last quote ARGS per taker+chain to keep parameters consistent (prevents model drift)
const lastQuoteArgsCache = new Map(); // key: `${taker}|${chainId}` -> { sellToken, buyToken, sellAmount, slippageBps }
const LAST_QUOTE_TTL = 20000; // 20 seconds TTL for cached quotes

// REMOVED: This was blocking bubble tools! Now using plugin-based filtering instead.

// Request cache for deduplication
const requestCache = new Map();
const CACHE_TTL = 5000; // 5 seconds

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

export async function handleToolCall({ functionName, functionArgs, session, req }) {
  // Check if tool is available based on enabled plugins
  const availableTools = getAvailableTools(req);
  if (!availableTools.has(functionName)) {
    console.log(`🚫 Tool ${functionName} not available - plugin disabled`);
    return { status: 403, success: false, error: `Tool ${functionName} is not available (plugin disabled)` };
  }


  // Handle Lurky tools
  if (functionName === "getTrendingCoins" || functionName === "getCoinInsights") {
    try {
      // Import Lurky controller dynamically
      const { LurkyController } = await import('./lurkyController.js');
      
      if (functionName === "getTrendingCoins") {
        const result = await LurkyController.getCoins({ 
          query: { 
            coinSymbol: functionArgs.coinSymbol,
            limit: functionArgs.limit || 10 
          } 
        }, { json: (data) => data });
        return {
          success: true,
          data: result,
          message: `Trending coins data retrieved`
        };
      }
      
      if (functionName === "getCoinInsights") {
        const result = await LurkyController.getCoinInsights({ 
          params: { coinSymbol: functionArgs.coinSymbol } 
        }, { json: (data) => data });
        return {
          success: true,
          data: result,
          message: `Insights for ${functionArgs.coinSymbol}`
        };
      }
    } catch (error) {
      console.error(`Lurky ${functionName} error:`, error);
      return {
        success: false,
        error: `Failed to fetch ${functionName}: ${error.message}`,
        message: `Sorry, Lurky analytics are temporarily unavailable. Please try CoinStats for market data instead.`
      };
    }
  }

  // Handle ChangeNOW tools
  if (functionName === "getExchangeRate" || functionName === "createTransaction") {
    try {
      // Import ChangeNOW controller dynamically
      const { ChangeNowController } = await import('./changeNowController.js');
      
      if (functionName === "getExchangeRate") {
        const result = await ChangeNowController.getExchangeRate({ 
          query: { 
            from: functionArgs.fromCurrency,
            to: functionArgs.toCurrency,
            amount: functionArgs.amount || 1
          } 
        }, { json: (data) => data });
        return {
          success: true,
          data: result,
          message: `Exchange rate: ${functionArgs.fromCurrency} to ${functionArgs.toCurrency}`
        };
      }
      
      if (functionName === "createTransaction") {
        const result = await ChangeNowController.createTransaction({ 
          body: {
            from: functionArgs.fromCurrency,
            to: functionArgs.toCurrency,
            amount: functionArgs.amount,
            address: functionArgs.address
          }
        }, { json: (data) => data });
        return {
          success: true,
          data: result,
          message: `Transaction created: ${functionArgs.fromCurrency} to ${functionArgs.toCurrency}`
        };
      }
    } catch (error) {
      console.error(`ChangeNOW ${functionName} error:`, error);
      return {
        success: false,
        error: `Failed to fetch ${functionName}: ${error.message}`
      };
    }
  }

  // Handle wallet balance first (doesn't need token resolution)
  if (functionName === "getWalletBalance") {
    const { chainId, taker } = injectWalletContext(functionArgs, session);
    // Default to Base (8453) if no specific chain provided, since that's where most tokens are
    const cid = Number(chainId) || 8453;
    const chainLabel = cid === 1 ? "Ethereum" : cid === 8453 ? "Base" : `Chain ${cid}`;

    // Wallet balance requires taker address
    if (!taker) {
      console.error('❌ Missing taker address for getWalletBalance');
      return {
        success: false,
        error: 'Wallet address is required to check balance. Please connect your wallet.',
        requiresWallet: true
      };
    }
    
    console.log('💰 Calling portfolio API for:', {
      address: taker,
      chainId: cid
    });
    
    try {
      // Use the new multi-chain portfolio scanner
      const response = await fetch(`http://localhost:3001/api/portfolio/${taker}`);
      const portfolioResult = await response.json();

      console.log('💰 Multi-chain portfolio result:', portfolioResult);
      
      if (!portfolioResult.success) {
        return {
          success: false,
          error: portfolioResult.error || 'Failed to fetch portfolio'
        };
      }

      const tokens = portfolioResult.data || [];
      
      if (tokens.length > 0) {
        // Group tokens by chain for better message
        const chainGroups = tokens.reduce((acc, token) => {
          if (!acc[token.chain]) acc[token.chain] = [];
          acc[token.chain].push(token);
          return acc;
        }, {});
        
        const chainSummary = Object.entries(chainGroups)
          .map(([chain, chainTokens]) => `${chainTokens.length} tokens on ${chain}`)
          .join(', ');
          
        const topTokens = tokens.slice(0, 5).map(t => `${t.balance} ${t.symbol} (${t.chain})`).join(', ');
        
        const message = `Found ${tokens.length} tokens across multiple chains: ${chainSummary}. Top tokens: ${topTokens}`;
        
        return {
          success: true,
          data: {
            address: taker,
            balances: tokens,
            totalTokens: tokens.length,
            message: message
          },
          message: message
        };
      } else {
        return {
          success: true,
          data: {
            address: taker,
            balances: [],
            totalTokens: 0,
            message: `Scanned your wallet ${taker} across all major chains but found no tokens.`
          },
          message: `Scanned your wallet ${taker} across all major chains but found no tokens.`
        };
      }
    } catch (error) {
      console.error('💰 Portfolio API error:', error);
      return {
        success: false,
        error: 'Failed to fetch wallet portfolio: ' + error.message
      };
    }
  }

  const { chainId, taker } = injectWalletContext(functionArgs, session);
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
    // v2 REQUIRES taker for /quote
    if (!taker) {
      console.error('❌ Missing taker address for getSwapQuote - v2 requires it');
      return {
        success: false,
        error: 'Wallet address (taker) is required for swap quotes. Please connect your wallet.',
        requiresWallet: true
      };
    }
    
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
      taker: taker, // REQUIRED in v2
      chainId: cid
    });

    console.log('🔄 getSwapQuote result:', raw);
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
    // v2 REQUIRES taker for /quote (which executeSwap uses)
    if (!taker) {
      console.error('❌ Missing taker address for executeSwap - v2 requires it');
      return {
        success: false,
        error: 'Wallet address (taker) is required to execute swaps. Please connect your wallet.',
        requiresWallet: true
      };
    }
    
    console.log('🎯 executeSwap called with args:', functionArgs);
    console.log('🎯 taker:', taker, 'chainId:', cid);
    
    // For executeSwap, we need to get the quote with transaction data
    const raw = await callController(getSwapQuote, {
      sellToken: functionArgs.sellToken,
      buyToken: functionArgs.buyToken,
      sellAmount: functionArgs.sellAmountHuman || functionArgs.sellAmount,
      slippageBps: functionArgs.slippageBps ?? 50,
      taker: taker, // REQUIRED in v2
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
    
    // CRITICAL FIX: Check for ACTUAL shortfalls with proper fallback logic
    const issues = raw.data?.issues || null;
    const sellAmountBase = raw.data?.sellAmount || toBaseUnits(functionArgs.sellAmountHuman || functionArgs.sellAmount, sellInfo.decimals);
    
    // ROBUST allowance check - handles missing 'required' field with on-chain fallback
    const allowanceShort = await needsAllowance({
      quote: raw.data,
      sellAmountBase,
      taker,
      chainId: cid
    });
    
    const balanceShort = hasInsufficientBalance(issues, sellAmountBase);
    
    console.log('🔍 Issue checks:', { 
      hasIssues: !!issues,
      allowanceActual: issues?.allowance?.actual,
      allowanceRequired: issues?.allowance?.required || 'computed locally as sellAmount',
      sellAmountBase,
      allowanceShort, 
      balanceShort, 
      issues 
    });
    
    // Only block on actual insufficient balance
    if (balanceShort) {
      return {
        success: false,
        error: 'Transaction cannot proceed due to insufficient balance',
        issues,
        messages: [
          `Insufficient balance: have ${issues.balance.actual}, need ${issues.balance.required}`
        ],
        hint: 'Please reduce sell amount or top up your wallet.'
      };
    }
    
    // Only block on actual insufficient allowance
    if (allowanceShort) {
      const spender = issues?.allowance?.spender || raw.data.allowanceTarget;
      const approvalAmount = issues?.allowance?.required || sellAmountBase;
      
      console.log('⚠️ Approval needed:', {
        token: raw.data.sellToken,
        spender,
        currentAllowance: issues?.allowance?.actual || '0',
        requiredAmount: approvalAmount
      });
      
      return {
        success: true,
        action: 'approval_required',
        requiresApproval: true,
        approval: {
          token: raw.data.sellToken,
          spender,
          amount: approvalAmount
        },
        allowanceTarget: spender,
        issues,
        data: raw.data,
        message: `Token approval required before executing the swap. Please approve the transaction in your wallet to allow the contract to spend your tokens. After approval, the swap will be executed automatically.`
      };
    }
    
    // If we get here, no blocking issues - proceed with swap!

    // CRITICAL: Ensure we have valid transaction data from v2 response
    if (!raw.data?.transaction?.to || !raw.data?.transaction?.data) {
      console.error('❌ Malformed quote: missing transaction.to/data', raw.data);
      return {
        success: false,
        error: 'Malformed quote: missing transaction.to/data fields required for execution',
        details: raw.data,
        hint: 'The 0x API did not return executable transaction data. Please try again.'
      };
    }
    
    // Format the transaction data for the frontend
    const formatted = formatSwapFrom0x({
      quoteOrPrice: raw.data,
      sellInfo, buyInfo, chainLabel
    });

    // CRITICAL: Use standardized transaction envelope contract
    const qtx = raw.data.transaction;
    
    // Create properly formatted transaction envelope
    const txEnvelope = createTxEnvelope({
      from: taker,                    // REQUIRED for MetaMask
      to: qtx?.to,                    // AllowanceHolder address
      data: qtx?.data,                 // Transaction calldata  
      value: qtx?.value ?? '0',        // ETH value (will be hex-encoded)
      gas: qtx?.gas,                   // Gas limit (will be hex-encoded)
      gasPrice: qtx?.gasPrice,         // Gas price (will be hex-encoded)
      chainId: cid                     // Chain ID
    });
    
    console.log('🎯 Transaction envelope prepared:', {
      from: txEnvelope.from,
      to: txEnvelope.to,
      dataLength: txEnvelope.data?.length || 0,
      value: txEnvelope.value,
      gas: txEnvelope.gas,
      gasPrice: txEnvelope.gasPrice,
      chainId: txEnvelope.chainId
    });

    const result = {
      success: true,
      data: raw.data,
      ui: formatted,
      // PRIMARY: Standardized transaction envelope
      txEnvelope: txEnvelope,
      // LEGACY: Keep these for backward compatibility
      transaction: txEnvelope,
      walletTransactions: [{
        action: 'executeSwap',
        transactionData: txEnvelope
      }],
      transactionData: txEnvelope,
      // Flags
      requiresWalletApproval: false,
      walletAction: 'executeSwap',
      // CRITICAL: Don't generate AI response - let frontend handle wallet interaction
      message: `Transaction prepared. Please approve in your wallet.`,
      // Signal to frontend that this needs wallet interaction before AI responds
      needsWalletInteraction: true
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
      
    case 'getCoinGeckoData':
    case 'getCoinGeckoPrices':
      return {
        type: 'coingecko',
        id: bubbleId,
        title: 'CoinGecko - AI Data',
        content: formatCoinGeckoData(result.data),
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
      
    case 'getWalletBalance':
      return {
        type: 'portfolio',
        id: bubbleId,
        title: '0x Portfolio - Wallet Balance',
        content: result.message || 'Wallet balance retrieved',
        loading: false,
        source: 'AI Tool Call',
        portfolioData: result.data
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
  if (data.coins && Array.isArray(data.coins) && data.coins.length > 0) {
    const coin = data.coins[0];
    let text = `${coin.name || coin.symbol} Social Analytics\n\n`;
    
    if (coin.mentions) {
      text += `Sentiment Analysis:\n`;
      text += `• Bullish: ${coin.mentions.bullish || 0}\n`;
      text += `• Bearish: ${coin.mentions.bearish || 0}\n`;
      text += `• Neutral: ${coin.mentions.neutral || 0}\n`;
      text += `• Total: ${coin.mentions.total || 0}\n`;
      text += `• Overall: ${coin.mentions.overall_sentiment || 'Unknown'}\n\n`;
    }
    
    text += `Powered by Lurky Analytics`;
    return text;
  }
  return 'Lurky social sentiment data retrieved';
}

/**
 * Format ChangeNOW data for bubble display
 */
function formatChangeNowData(data) {
  if (data.fromCurrency && data.toCurrency) {
    let text = `${data.fromCurrency.ticker?.toUpperCase()} → ${data.toCurrency.ticker?.toUpperCase()} Exchange\n\n`;
    
    if (data.exchangeAmount) {
      text += `Rate: 1 ${data.fromCurrency.ticker?.toUpperCase()} = ${data.exchangeAmount.estimatedAmount} ${data.toCurrency.ticker?.toUpperCase()}\n`;
    }
    
    if (data.minAmount) {
      text += `Minimum: ${data.minAmount.minAmount} ${data.fromCurrency.ticker?.toUpperCase()}\n`;
    }
    
    if (data.marketInfo?.fee) {
      text += `Fee: ${(data.marketInfo.fee * 100).toFixed(2)}%\n`;
    }
    
    text += `\nProcessing: ~5-30 minutes\n`;
    text += `Powered by ChangeNOW`;
    return text;
  }
  return 'ChangeNOW exchange data retrieved';
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
  
  // Simple request deduplication cache
  static requestCache = new Map();
  static CACHE_TTL = 5000; // 5 seconds

  /**
   * Generate chat completion using OpenAI
   */
  static async generateChatCompletion(req, res) {
    try {
      console.log('🚀 DEBUG: Request received, starting processing...');
      const { messages, model = 'gpt-4o-mini', max_tokens = 1000, temperature = 0.7, taker, chainId, skip_final_completion = false } = req.body;
      console.log('🚀 DEBUG: Request body parsed, last message:', messages[messages.length - 1]?.content);

      // Create cache key for deduplication
      const cacheKey = JSON.stringify({ messages, taker, chainId });
      const now = Date.now();
      
      // Check if we have a recent identical request
      if (requestCache.has(cacheKey)) {
        const cached = requestCache.get(cacheKey);
        if (now - cached.timestamp < CACHE_TTL) {
          console.log('🔄 Returning cached response for duplicate request');
          return res.json(cached.response);
        }
      }

      console.log('📧 Messages Content --> ', messages);
      console.log('🔗 Wallet Info --> ', { taker, chainId });

      // Create session with wallet context for tool calls
      const session = {
        walletAddress: taker,
        walletChainId: chainId
      }; 

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
            name: "getCoinData",
            description: "Get cryptocurrency market data and price information",
            parameters: {
              type: "object",
              properties: {
                coinSymbol: {
                  type: "string",
                  description: "Cryptocurrency symbol (e.g., BTC, ETH, PEPE)"
                }
              },
              required: ["coinSymbol"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "searchCoins",
            description: "Search for cryptocurrency information by name or symbol",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for cryptocurrency"
                }
              },
              required: ["query"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getMarketData",
            description: "Get general cryptocurrency market overview",
            parameters: {
              type: "object",
              properties: {
                limit: {
                  type: "number",
                  description: "Number of coins to return (default 10)"
                }
              }
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
                chainId: {
                  type: "number",
                  description: "Chain ID (1 for Ethereum mainnet)"
                },
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
              required: ["chainId", "sellToken", "buyToken", "sellAmount", "taker"]
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
                chainId: {
                  type: "number",
                  description: "Chain ID (1 for Ethereum mainnet)"
                },
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
              required: ["chainId", "sellToken", "buyToken", "sellAmount", "taker"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getWalletBalance",
            description: "Get wallet balance and token holdings using 0x Protocol",
            parameters: {
              type: "object",
              properties: {
                chainId: {
                  type: "number",
                  description: "Chain ID (1 for Ethereum mainnet, 8453 for Base)"
                }
              },
              required: []
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
                chainId: {
                  type: "number",
                  description: "Chain ID (1 for Ethereum mainnet)"
                },
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
              required: ["chainId", "sellToken", "buyToken", "sellAmount", "taker"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getTrendingCoins",
            description: "Get trending cryptocurrency data and social sentiment from Lurky",
            parameters: {
              type: "object",
              properties: {
                coinSymbol: {
                  type: "string",
                  description: "Cryptocurrency symbol to get trending data for (optional)"
                },
                limit: {
                  type: "number",
                  description: "Number of trending coins to return (default 10)"
                }
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getCoinInsights",
            description: "Get detailed cryptocurrency insights and analytics from Lurky",
            parameters: {
              type: "object",
              properties: {
                coinSymbol: {
                  type: "string",
                  description: "Cryptocurrency symbol to get insights for"
                }
              },
              required: ["coinSymbol"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "getExchangeRate",
            description: "Get exchange rate between cryptocurrencies using ChangeNOW",
            parameters: {
              type: "object",
              properties: {
                fromCurrency: {
                  type: "string",
                  description: "Source currency symbol (e.g., BTC, ETH, USD)"
                },
                toCurrency: {
                  type: "string",
                  description: "Target currency symbol (e.g., BTC, ETH, USD)"
                },
                amount: {
                  type: "number",
                  description: "Amount to exchange (default 1)"
                }
              },
              required: ["fromCurrency", "toCurrency"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "createTransaction",
            description: "Create a cryptocurrency exchange transaction using ChangeNOW",
            parameters: {
              type: "object",
              properties: {
                fromCurrency: {
                  type: "string",
                  description: "Source currency symbol"
                },
                toCurrency: {
                  type: "string",
                  description: "Target currency symbol"
                },
                amount: {
                  type: "number",
                  description: "Amount to exchange"
                },
                address: {
                  type: "string",
                  description: "Recipient wallet address"
                }
              },
              required: ["fromCurrency", "toCurrency", "amount", "address"]
            }
          }
        }
      ];

      // Filter tools based on enabled plugins
      const availableTools = filterToolsForOpenAI(req, allTools);

      console.log('🤖 Making OpenAI API call with:', {
        model,
        messageCount: messages.length,
        toolCount: availableTools.length,
        maxTokens: max_tokens,
        temperature,
        hasTools: availableTools.length > 0,
        tools: availableTools.map(t => t.function.name)
      });

      // Make request to OpenAI with function calling tools
      console.log('🚀 DEBUG: Making initial OpenAI API call...');
      const completion = await openai.chat.completions.create({
        model, // Use consistent model from request
        messages,
        max_tokens,
        temperature,
        tools: availableTools.length > 0 ? availableTools : undefined, // Only include tools if available
        tool_choice: availableTools.length > 0 ? "auto" : undefined // Only set tool_choice if tools available
      });

      console.log('✅ OpenAI API call successful:', {
        id: completion.id,
        model: completion.model,
        choices: completion.choices.length,
        hasToolCalls: !!completion.choices[0].message.tool_calls
      });

      // Check if AI wants to call functions
      const message = completion.choices[0].message;
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log('🔧 AI wants to call functions:', message.tool_calls);
        
        // Execute function calls
        const functionResults = [];
        let hasSwapPrice = false;
        let hasSwapQuote = false;
        let hasExecuteSwap = false;
        let swapQuoteResult = null;
        
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`🚀 Executing function: ${functionName}`, functionArgs);
          console.log(`🔍 Total tool calls in this message: ${message.tool_calls.length}`);
          
          try {
            // Use the new handleToolCall function with proper formatting
            const result = await handleToolCall({
              functionName,
              functionArgs,
              session: session, // Pass session for wallet context
              req // Pass request for plugin state checking
            });
            
            // Track swap function calls
            if (functionName === 'getSwapPrice') hasSwapPrice = true;
            if (functionName === 'getSwapQuote') {
              hasSwapQuote = true;
              swapQuoteResult = result;
            }
            if (functionName === 'executeSwap') hasExecuteSwap = true;
            
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
        
        // Prepare aggregations for tool results and UI actions
        const walletTransactions = [];
        const bubbleUpdates = [];
        let nextAction = null;
        let approval = null; // { token, spender, amount }
        let allowanceTarget = null;
        let issues = null;

        // Force execute after user confirmation if we have a recent quote but no execute
        try {
          let swapQuoteArgs = null;
          let hasExecuteSwap = false;
          for (const tc of message.tool_calls) {
            const fn = tc.function?.name;
            const args = (() => { try { return JSON.parse(tc.function?.arguments || '{}'); } catch { return {}; }})();
            if (fn === 'getSwapQuote') swapQuoteArgs = args;
            if (fn === 'executeSwap') hasExecuteSwap = true;
          }

          // Get last user message safely from request body (avoid undefined vars)
          const convMessages = Array.isArray(req?.body?.messages) ? req.body.messages : [];
          const lastUserMsg = convMessages.filter(m => m?.role === 'user').at(-1)?.content?.trim()?.toLowerCase() || '';
          const confirmed = /^(yes|yep|yeah|ok|okay|confirm|execute|proceed|go ahead|do it)$/.test(lastUserMsg);

          if (confirmed && swapQuoteArgs && !hasExecuteSwap) {
            console.log('⚡ Forcing executeSwap after user confirmation with previous quote args');
            const execResult = await handleToolCall({
              functionName: 'executeSwap',
              functionArgs: swapQuoteArgs,
              session,
              req
            });
            functionResults.push({
              tool_call_id: `forced_exec_${Date.now()}`,
              role: 'tool',
              content: JSON.stringify(execResult)
            });
            // Also push a bubble update if applicable
            if (execResult?.success && execResult?.data) {
              const bubbleData = createBubbleDataFromTool('executeSwap', execResult);
              if (bubbleData) bubbleUpdates.push(bubbleData);
            }
          }
        } catch (e) {
          console.warn('Force-exec guard error:', e?.message);
        }
        
        // Filter function results to only include those with valid tool_call_ids
        const validToolCallIds = new Set(message.tool_calls.map(tc => tc.id));
        const validFunctionResults = functionResults.filter(result => 
          validToolCallIds.has(result.tool_call_id)
        );
        
        let finalCompletion = null;
        
        // If skip_final_completion is true, return tool results immediately
        if (skip_final_completion) {
          console.log('🚀 Skipping final completion - returning tool results immediately');
          
          // Collect messages from tool results to show meaningful content
          let toolMessages = [];
          for (const result of functionResults) {
            try {
              const parsedResult = JSON.parse(result.content);
              if (parsedResult.message) {
                toolMessages.push(parsedResult.message);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
          
          const toolContent = toolMessages.length > 0 
            ? toolMessages.join('\n\n') 
            : 'Tool execution completed. Results are ready.';
          
          // Create a mock completion response with actual tool messages
          finalCompletion = {
            id: `skip_${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: toolContent
              },
              finish_reason: 'tool_calls'
            }],
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
          };
        } else {
          // Send function results back to OpenAI for final response
          const followUpMessages = [
            ...messages,
            message, // AI's function call message
            ...validFunctionResults // Only valid function results
          ];
          
          // Add instruction to avoid emojis in final response
          const finalMessages = [
            {
              role: "system",
              content: "Keep responses clean and professional without emojis. Present trading information clearly and concisely."
            },
            ...followUpMessages
          ];
          
          finalCompletion = await openai.chat.completions.create({
            model,
            messages: finalMessages,
            max_tokens,
            temperature
          });
        }
        
        // Check if any function results require wallet approval or bubble updates
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          const result = functionResults.find(fr => fr.tool_call_id === toolCall.id);
          
          if (result) {
            const parsedResult = JSON.parse(result.content);
            
            // Handle wallet transactions and approval data
            if (functionName === 'executeSwap') {
              // Handle both singular and plural forms
              if (parsedResult.walletTransactions && Array.isArray(parsedResult.walletTransactions)) {
                walletTransactions.push(...parsedResult.walletTransactions);
              } else if (parsedResult.walletTransaction) {
                walletTransactions.push(parsedResult.walletTransaction);
              }
              
              // Handle approval path
              if (parsedResult.action === 'approval_required') {
                nextAction = 'approval_required';
                approval = parsedResult.approval || null;
                allowanceTarget = parsedResult.allowanceTarget || parsedResult.approval?.spender || null;
                issues = parsedResult.issues || null;
              }
            }
            
            // Handle bubble updates (new logic)
            if (parsedResult.success && parsedResult.data) {
              const bubbleData = createBubbleDataFromTool(functionName, parsedResult);
              if (bubbleData) {
                bubbleUpdates.push(bubbleData);
              }
            }

            // Capture approval-required flow for UI
            if (functionName === 'executeSwap') {
              if (parsedResult?.action === 'approval_required' || parsedResult?.requiresApproval === true) {
                nextAction = 'approval_required';
                approval = parsedResult?.approval || null;
                allowanceTarget = parsedResult?.allowanceTarget || parsedResult?.approval?.spender || null;
                issues = parsedResult?.issues || null;
              }
            }
          }
        }
        
        // Store response in cache for deduplication
        const response = {
          success: true,
          data: {
            id: finalCompletion.id,
            object: finalCompletion.object,
            created: finalCompletion.created,
            model: finalCompletion.model,
            choices: finalCompletion.choices,
            usage: finalCompletion.usage,
            function_calls_executed: message.tool_calls.length,
            walletTransactions: walletTransactions,
            bubbleUpdates: bubbleUpdates,
            // Expose approval fields so the frontend can trigger wallet approval
            nextAction,
            approval,
            allowanceTarget,
            issues
          }
        };
        
        console.log('🚀 DEBUG: About to send response to frontend:', {
          hasWalletTransactions: walletTransactions.length > 0,
          hasBubbleUpdates: bubbleUpdates.length > 0,
          responseSize: JSON.stringify(response).length
        });
        
        // Cache the response
        requestCache.set(cacheKey, {
          response: response,
          timestamp: now
        });
        
        // Clean old cache entries (keep only last 100)
        if (requestCache.size > 100) {
          const oldestKey = requestCache.keys().next().value;
          requestCache.delete(oldestKey);
        }
        
        // Return final response with function results, wallet transactions, and bubble updates
        console.log('🚀 DEBUG: Sending final response to frontend now...');
        res.json(response);
        console.log('🚀 DEBUG: Response sent successfully!');
        
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
