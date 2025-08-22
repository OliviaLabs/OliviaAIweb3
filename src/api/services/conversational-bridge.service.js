import { realLayerZeroService } from './layerzero-real.service';
import { log, error as logError } from '../../utils/logger';

class ConversationalBridgeService {
  constructor() {
    this.activeBridgeSessions = new Map(); // Store active bridge conversations
  }

  // Start a new bridge conversation
  startBridgeConversation(userId, initialMessage = '') {
    const sessionId = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session = {
      id: sessionId,
      userId,
      step: 'token_selection',
      data: {
        token: null,
        amount: null,
        fromChain: 'ethereum', // default
        toChain: null,
        estimatedFee: null
      },
      messages: [],
      createdAt: new Date().toISOString()
    };

    // Try to extract initial parameters from the message
    if (initialMessage) {
      const extracted = this.extractBridgeIntent(initialMessage);
      if (extracted.token) session.data.token = extracted.token;
      if (extracted.amount) session.data.amount = extracted.amount;
      if (extracted.fromChain) session.data.fromChain = extracted.fromChain;
      if (extracted.toChain) session.data.toChain = extracted.toChain;
    }

    this.activeBridgeSessions.set(sessionId, session);
    log('🌉 Started bridge conversation:', sessionId, session.data);
    
    return this.getNextQuestion(sessionId);
  }

  // Extract bridge intent from user message
  extractBridgeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Extract token
    let token = null;
    if (lowerMessage.includes('usdc')) token = 'USDC';
    else if (lowerMessage.includes('usdt')) token = 'USDT';
    else if (lowerMessage.includes('eth')) token = 'ETH';
    
    // Extract amount
    let amount = null;
    const amountMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*(?:usdc|usdt|eth|dollars?|\$)/);
    if (amountMatch) amount = amountMatch[1];
    
    // Extract chains
    let fromChain = null;
    let toChain = null;
    
    if (lowerMessage.includes('from ethereum')) fromChain = 'ethereum';
    else if (lowerMessage.includes('from polygon')) fromChain = 'polygon';
    else if (lowerMessage.includes('from arbitrum')) fromChain = 'arbitrum';
    
    if (lowerMessage.includes('to arbitrum') || lowerMessage.includes('arbitrum')) toChain = 'arbitrum';
    else if (lowerMessage.includes('to polygon') || lowerMessage.includes('polygon')) toChain = 'polygon';
    else if (lowerMessage.includes('to optimism') || lowerMessage.includes('optimism')) toChain = 'optimism';
    else if (lowerMessage.includes('to base') || lowerMessage.includes('base')) toChain = 'base';
    
    return { token, amount, fromChain, toChain };
  }

  // Process user response and get next question
  processResponse(sessionId, userMessage) {
    const session = this.activeBridgeSessions.get(sessionId);
    if (!session) {
      return {
        message: "Sorry, I couldn't find your bridge session. Let's start over - what token would you like to bridge?",
        completed: false,
        needsSignature: false
      };
    }

    const lowerMessage = userMessage.toLowerCase();
    
    switch (session.step) {
      case 'token_selection':
        return this.handleTokenSelection(session, lowerMessage);
      case 'amount_selection':
        return this.handleAmountSelection(session, lowerMessage);
      case 'chain_selection':
        return this.handleChainSelection(session, lowerMessage);
      case 'confirmation':
        return this.handleConfirmation(session, lowerMessage);
      default:
        return this.getNextQuestion(sessionId);
    }
  }

  handleTokenSelection(session, message) {
    let token = null;
    if (message.includes('usdc')) token = 'USDC';
    else if (message.includes('usdt')) token = 'USDT';
    else if (message.includes('eth')) token = 'ETH';
    
    if (token) {
      session.data.token = token;
      session.step = 'amount_selection';
      return {
        message: `Great! You want to bridge ${token}. How much ${token} would you like to bridge? (e.g., "100 USDC" or "0.5 ETH")`,
        completed: false,
        needsSignature: false,
        sessionId: session.id
      };
    }
    
    return {
      message: "I support bridging USDC, USDT, and ETH. Which token would you like to bridge?",
      completed: false,
      needsSignature: false,
      sessionId: session.id
    };
  }

  handleAmountSelection(session, message) {
    const amountMatch = message.match(/(\d+(?:\.\d+)?)/);
    if (amountMatch) {
      session.data.amount = amountMatch[1];
      session.step = 'chain_selection';
      return {
        message: `Perfect! ${session.data.amount} ${session.data.token}. Which chain would you like to bridge to? I support:\n• Arbitrum\n• Polygon\n• Optimism\n• Base\n• BSC\n• Avalanche`,
        completed: false,
        needsSignature: false,
        sessionId: session.id
      };
    }
    
    return {
      message: `Please specify the amount of ${session.data.token} you want to bridge (e.g., "100" or "0.5")`,
      completed: false,
      needsSignature: false,
      sessionId: session.id
    };
  }

  handleChainSelection(session, message) {
    let toChain = null;
    if (message.includes('arbitrum')) toChain = 'arbitrum';
    else if (message.includes('polygon')) toChain = 'polygon';
    else if (message.includes('optimism')) toChain = 'optimism';
    else if (message.includes('base')) toChain = 'base';
    else if (message.includes('bsc') || message.includes('binance')) toChain = 'bsc';
    else if (message.includes('avalanche') || message.includes('avax')) toChain = 'avalanche';
    
    if (toChain) {
      session.data.toChain = toChain;
      session.step = 'confirmation';
      
      // Get fee estimate
      this.estimateFee(session);
      
      const chainNames = {
        arbitrum: 'Arbitrum',
        polygon: 'Polygon',
        optimism: 'Optimism',
        base: 'Base',
        bsc: 'BSC',
        avalanche: 'Avalanche'
      };
      
      return {
        message: `Awesome! Here's your bridge summary:\n\n🔄 **Bridge Details**\n• Token: ${session.data.amount} ${session.data.token}\n• From: Ethereum\n• To: ${chainNames[toChain]}\n• Estimated Fee: ~$${session.data.estimatedFee || '5-10'}\n\nReady to proceed? Just say "yes" or "confirm" and I'll prepare the transaction for your signature! 🚀`,
        completed: false,
        needsSignature: false,
        sessionId: session.id,
        bridgeData: session.data
      };
    }
    
    return {
      message: "Please choose a destination chain: Arbitrum, Polygon, Optimism, Base, BSC, or Avalanche",
      completed: false,
      needsSignature: false,
      sessionId: session.id
    };
  }

  handleConfirmation(session, message) {
    if (message.includes('yes') || message.includes('confirm') || message.includes('proceed')) {
      return {
        message: `🎯 Perfect! I'm preparing your LayerZero bridge transaction:\n\n• ${session.data.amount} ${session.data.token} from Ethereum to ${session.data.toChain}\n• Fee: ~$${session.data.estimatedFee || '5-10'}\n\n**Please check your wallet and sign the transaction!** 🔐\n\nThe LayerZero bubble will show the transaction details once confirmed.`,
        completed: true,
        needsSignature: true,
        sessionId: session.id,
        bridgeData: session.data
      };
    }
    
    if (message.includes('no') || message.includes('cancel')) {
      this.activeBridgeSessions.delete(session.id);
      return {
        message: "No problem! Bridge cancelled. Let me know if you want to try again later! 👍",
        completed: true,
        needsSignature: false
      };
    }
    
    return {
      message: "Would you like to proceed with this bridge? Say 'yes' to confirm or 'no' to cancel.",
      completed: false,
      needsSignature: false,
      sessionId: session.id
    };
  }

  async estimateFee(session) {
    try {
      const fee = await realLayerZeroService.estimateBridgeFee(
        session.data.token,
        session.data.amount,
        session.data.fromChain,
        session.data.toChain
      );
      session.data.estimatedFee = fee;
    } catch (error) {
      logError('Failed to estimate bridge fee:', error);
      session.data.estimatedFee = '5.00'; // fallback
    }
  }

  // Execute the actual bridge transaction
  async executeBridge(sessionId, userAddress) {
    const session = this.activeBridgeSessions.get(sessionId);
    if (!session) {
      throw new Error('Bridge session not found');
    }

    try {
      log(`🌉 Executing bridge for session ${sessionId}`);
      
      const txHash = await realLayerZeroService.bridgeToken(
        session.data.token,
        session.data.amount,
        session.data.fromChain,
        session.data.toChain,
        userAddress
      );

      // Update session with transaction hash
      session.data.txHash = txHash;
      session.data.status = 'pending';
      
      return {
        success: true,
        txHash,
        message: 'Bridge transaction submitted successfully!',
        layerZeroScanUrl: `https://layerzeroscan.com/tx/${txHash}`
      };
    } catch (error) {
      logError('Failed to execute bridge:', error);
      throw error;
    }
  }

  getNextQuestion(sessionId) {
    const session = this.activeBridgeSessions.get(sessionId);
    if (!session) return null;

    switch (session.step) {
      case 'token_selection':
        if (session.data.token) {
          session.step = 'amount_selection';
          return this.handleTokenSelection(session, session.data.token.toLowerCase());
        }
        return {
          message: "I can help you bridge tokens across chains! Which token would you like to bridge? I support USDC, USDT, and ETH.",
          completed: false,
          needsSignature: false,
          sessionId: session.id
        };
        
      case 'amount_selection':
        return {
          message: `How much ${session.data.token} would you like to bridge?`,
          completed: false,
          needsSignature: false,
          sessionId: session.id
        };
        
      default:
        return {
          message: "Let's start your bridge! Which token would you like to bridge?",
          completed: false,
          needsSignature: false,
          sessionId: session.id
        };
    }
  }

  // Get session data for bubble auto-fill
  getSessionData(sessionId) {
    return this.activeBridgeSessions.get(sessionId);
  }

  // Clean up completed sessions
  cleanupSession(sessionId) {
    this.activeBridgeSessions.delete(sessionId);
  }

  // Check if message is bridge-related
  isBridgeIntent(message) {
    const bridgeKeywords = [
      'bridge', 'cross-chain', 'layerzero', 'send', 'transfer',
      'arbitrum', 'polygon', 'optimism', 'base', 'bsc', 'avalanche',
      'usdc', 'usdt', 'eth'
    ];
    
    const lowerMessage = message.toLowerCase();
    return bridgeKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

export const conversationalBridgeService = new ConversationalBridgeService();
