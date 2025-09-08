// Trading Tools for 0x Protocol Integration
import { zeroXService } from '../api/services/zerox.service.js';

/**
 * Get swap quote from 0x Protocol
 * @param {Object} params - Trading parameters
 * @param {string} params.sellToken - Token to sell (symbol or address)
 * @param {string} params.buyToken - Token to buy (symbol or address)  
 * @param {string} params.sellAmount - Amount to sell (in token units)
 * @param {string} params.userAddress - User's wallet address
 * @param {Object} userContext - User context from WebSocket
 */
export async function getSwapQuote(params, userContext) {
  try {
    console.log('🔄 AI getting swap quote:', params);
    
    const { sellToken, buyToken, sellAmount, userAddress } = params;
    
    if (!sellToken || !buyToken || !sellAmount) {
      throw new Error('Missing required parameters: sellToken, buyToken, sellAmount');
    }
    
    // Call the 0x service to get quote
    const quote = await zeroXService.getSwapQuote(
      sellToken,
      buyToken, 
      sellAmount,
      null, // buyAmount
      userAddress // takerAddress
    );
    
    console.log('💰 Quote received:', quote);
    
    return {
      success: true,
      quote,
      sellToken,
      buyToken,
      sellAmount,
      userAddress
    };
    
  } catch (error) {
    console.error('❌ Get swap quote failed:', error);
    throw new Error(`Failed to get swap quote: ${error.message}`);
  }
}

/**
 * Get swap price (lighter version of quote)
 * @param {Object} params - Trading parameters
 * @param {string} params.sellToken - Token to sell (symbol or address)
 * @param {string} params.buyToken - Token to buy (symbol or address)
 * @param {string} params.sellAmount - Amount to sell (in token units)
 * @param {Object} userContext - User context from WebSocket
 */
export async function getSwapPrice(params, userContext) {
  try {
    console.log('💲 AI getting swap price:', params);
    
    const { sellToken, buyToken, sellAmount } = params;
    
    if (!sellToken || !buyToken || !sellAmount) {
      throw new Error('Missing required parameters: sellToken, buyToken, sellAmount');
    }
    
    // Call the 0x service to get price
    const price = await zeroXService.getSwapPrice(
      sellToken,
      buyToken,
      sellAmount
    );
    
    console.log('💵 Price received:', price);
    
    return {
      success: true,
      price,
      sellToken,
      buyToken,
      sellAmount
    };
    
  } catch (error) {
    console.error('❌ Get swap price failed:', error);
    throw new Error(`Failed to get swap price: ${error.message}`);
  }
}

/**
 * Execute swap transaction
 * @param {Object} params - Trading parameters
 * @param {Object} params.quoteData - Quote data from getSwapQuote
 * @param {string} params.userAddress - User's wallet address
 * @param {Object} userContext - User context from WebSocket
 */
export async function executeSwap(params, userContext) {
  try {
    console.log('⚡ AI executing swap:', params);
    
    const { quoteData, userAddress } = params;
    
    if (!quoteData || !userAddress) {
      throw new Error('Missing required parameters: quoteData, userAddress');
    }
    
    // This would typically interact with the user's wallet
    // For now, return the transaction data for the frontend to execute
    return {
      success: true,
      message: 'Swap transaction prepared. Please confirm in your wallet.',
      transactionData: quoteData,
      userAddress
    };
    
  } catch (error) {
    console.error('❌ Execute swap failed:', error);
    throw new Error(`Failed to execute swap: ${error.message}`);
  }
}

/**
 * Get supported tokens from 0x Protocol
 * @param {Object} params - Parameters (optional)
 * @param {number} params.chainId - Chain ID (default: 1 for Ethereum)
 * @param {Object} userContext - User context from WebSocket
 */
export async function getSupportedTokens(params = {}, userContext) {
  try {
    console.log('📋 AI getting supported tokens:', params);
    
    const { chainId = 1 } = params;
    
    // Call the 0x service to get supported tokens
    const tokens = await zeroXService.getTokens();
    
    console.log('🪙 Supported tokens received:', tokens);
    
    return {
      success: true,
      tokens,
      chainId
    };
    
  } catch (error) {
    console.error('❌ Get supported tokens failed:', error);
    throw new Error(`Failed to get supported tokens: ${error.message}`);
  }
}
