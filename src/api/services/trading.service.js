import { zeroXService } from './zerox.service.js';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, parseEther } from 'viem';

/**
 * Trading Service - Handles token swaps via 0x Protocol
 * Combines quotes, balance checks, and transaction execution
 */
export const tradingService = {
  
  /**
   * Get a trading quote with detailed breakdown
   */
  async getTradeQuote(fromToken, toToken, amount, userAddress) {
    try {
      // Convert amount to wei if dealing with ETH/tokens
      const sellAmount = fromToken.toLowerCase() === 'eth' 
        ? parseEther(amount.toString()).toString()
        : parseUnits(amount.toString(), 18).toString(); // Assuming 18 decimals for most tokens
      
      const quote = await zeroXService.getSwapQuote(
        fromToken,
        toToken,
        sellAmount,
        null,
        userAddress,
        '0.02' // 2% slippage default
      );
      
      if (!quote.result) {
        throw new Error('Failed to get quote from 0x Protocol');
      }
      
      const quoteData = quote.result;
      
      // Format the response for easy consumption
      return {
        success: true,
        data: {
          fromToken: fromToken.toUpperCase(),
          toToken: toToken.toUpperCase(),
          sellAmount: amount,
          buyAmount: formatUnits(BigInt(quoteData.buyAmount || '0'), 18),
          price: quoteData.price,
          guaranteedPrice: quoteData.guaranteedPrice,
          slippage: '2%',
          gasPrice: quoteData.gasPrice,
          estimatedGas: quoteData.estimatedGas,
          minimumProtocolFee: quoteData.minimumProtocolFee,
          to: quoteData.to,
          data: quoteData.data,
          value: quoteData.value,
          allowanceTarget: quoteData.allowanceTarget,
          priceImpact: this.calculatePriceImpact(quoteData.price, quoteData.guaranteedPrice)
        }
      };
    } catch (error) {
      console.error('Trading quote error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Calculate price impact percentage
   */
  calculatePriceImpact(price, guaranteedPrice) {
    if (!price || !guaranteedPrice) return '0%';
    const impact = ((parseFloat(price) - parseFloat(guaranteedPrice)) / parseFloat(price)) * 100;
    return `${Math.abs(impact).toFixed(2)}%`;
  },
  
  /**
   * Check if user has sufficient balance for trade
   */
  async checkBalance(tokenAddress, requiredAmount, userAddress) {
    try {
      // This would need to be implemented with actual balance checking
      // For now, return a placeholder
      return {
        success: true,
        hasBalance: true,
        currentBalance: '1000', // Placeholder
        requiredAmount: requiredAmount
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Execute a token swap transaction
   * Note: This requires the user's wallet to be connected and approve the transaction
   */
  async executeSwap(quoteData, userAddress) {
    try {
      // Return transaction data that can be executed by the wallet
      return {
        success: true,
        transaction: {
          to: quoteData.to,
          data: quoteData.data,
          value: quoteData.value,
          from: userAddress,
          gasLimit: quoteData.estimatedGas
        },
        message: 'Transaction ready for wallet approval'
      };
    } catch (error) {
      console.error('Trading execution error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Format trading summary for AI responses
   */
  formatTradeSummary(quoteData) {
    return `
🔄 **Trade Summary:**
• **Selling**: ${quoteData.sellAmount} ${quoteData.fromToken}
• **Buying**: ~${parseFloat(quoteData.buyAmount).toFixed(4)} ${quoteData.toToken}
• **Price**: 1 ${quoteData.fromToken} = ${parseFloat(quoteData.price).toFixed(6)} ${quoteData.toToken}
• **Slippage**: ${quoteData.slippage}
• **Price Impact**: ${quoteData.priceImpact}
• **Est. Gas**: ${quoteData.estimatedGas ? parseInt(quoteData.estimatedGas).toLocaleString() : 'N/A'}

⚠️ **Please confirm this trade before I execute it.**
    `;
  }
};

// Export for use in AI context
if (typeof window !== 'undefined') {
  window.tradingService = tradingService;
}
