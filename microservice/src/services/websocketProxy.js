import WebSocket from 'ws';
import { config } from '../config/config.js';
import fetch from 'node-fetch';

/**
 * WebSocket Proxy Service
 * Acts as a secure proxy between frontend and external WebSocket service
 */
export class WebSocketProxyService {
  constructor() {
    this.connections = new Map(); // Track client connections
    this.externalWsEndpoints = config.externalWebsocketUrls;
    this.currentEndpointIndex = 0;
  }

  /**
   * Create WebSocket proxy connection for a client
   */
  createProxyConnection(clientWs, clientId) {
    console.log(`🔗 Creating proxy connection for client: ${clientId}`);
    
    // Check if external endpoints are configured
    if (!this.externalWsEndpoints || this.externalWsEndpoints.length === 0) {
      console.error(`🚨 No external WebSocket endpoints configured for client: ${clientId}`);
      this.sendErrorToClient(clientWs, 'External WebSocket endpoints not configured. Please set EXTERNAL_WEBSOCKET_URLS in environment.');
      return;
    }
    
    // Try to connect to external WebSocket
    const externalWsUrl = this.externalWsEndpoints[this.currentEndpointIndex];
    console.log(`🌐 Connecting to external WebSocket: ${externalWsUrl}`);
    
    const externalWs = new WebSocket(externalWsUrl);
    
    // Store connection info
    const connectionInfo = {
      clientWs,
      externalWs,
      clientId,
      connected: false,
      lastPing: Date.now(),
      externalWsUrl
    };
    
    this.connections.set(clientId, connectionInfo);

    // External WebSocket event handlers
    externalWs.on('open', () => {
      console.log(`✅ External WebSocket connected for client: ${clientId} to ${externalWsUrl}`);
      connectionInfo.connected = true;
      
      // Send connection established message to client
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'connection',
          message: 'Secure proxy connection established',
          timestamp: new Date().toISOString(),
          externalUrl: externalWsUrl
        }));
      }
    });

    externalWs.on('message', (data) => {
      // Forward external WebSocket messages to client
      if (clientWs.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.parse(data.toString());
          console.log(`📨 Forwarding message to client ${clientId}:`, message.type || 'unknown');
          clientWs.send(data.toString());
        } catch (error) {
          console.error(`Error forwarding message to client ${clientId}:`, error);
          clientWs.send(data.toString()); // Forward as-is if parsing fails
        }
      }
    });

    externalWs.on('error', (error) => {
      console.error(`🚨 External WebSocket error for client ${clientId} (${externalWsUrl}):`, error.message);
      connectionInfo.connected = false;
      
      // Try next endpoint if available
      if (this.currentEndpointIndex < this.externalWsEndpoints.length - 1) {
        this.currentEndpointIndex++;
        console.log(`🔄 Trying next endpoint for client ${clientId}: ${this.externalWsEndpoints[this.currentEndpointIndex]}`);
        
        // Clean up current connection and retry
        this.cleanupConnection(clientId);
        setTimeout(() => {
          if (clientWs.readyState === WebSocket.OPEN) {
            this.createProxyConnection(clientWs, clientId);
          }
        }, 1000);
      } else {
        // All endpoints failed
        console.error(`🚨 All external endpoints failed for client ${clientId}`);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'error',
            message: 'Failed to connect to AI service. All endpoints unavailable.',
            code: 'CONNECTION_FAILED',
            triedEndpoints: this.externalWsEndpoints
          }));
        }
        // Reset endpoint index for next client
        this.currentEndpointIndex = 0;
      }
    });

    externalWs.on('close', (code, reason) => {
      console.log(`🔌 External WebSocket closed for client ${clientId}. Code: ${code}, Reason: ${reason}`);
      connectionInfo.connected = false;
      
      // Notify client of disconnection
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'disconnection',
          message: 'External service connection closed',
          code: code,
          reason: reason.toString()
        }));
      }
    });

    // Client WebSocket event handlers
    clientWs.on('message', (data) => {
      // Forward client messages to external WebSocket
      if (connectionInfo.connected && externalWs.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.parse(data.toString());
          console.log(`📤 Forwarding message from client ${clientId}:`, message.type || 'unknown');
          
          // Enhance message with context if it's a text message with context_awareness
          if (message.type === 'text' && message.data?.options?.context_awareness) {
            const context = message.data.options.context_awareness;
            if (Object.keys(context).length > 0) {
              // Build context string from the awareness data
              let contextString = '\n\n[Current Market Data Available to You]:\n';
              
              // Process market data
              if (context.market_data) {
                Object.entries(context.market_data).forEach(([token, tokenData]) => {
                  if (tokenData && typeof tokenData === 'object') {
                    // Handle nested data structure (data.data)
                    const data = tokenData.data || tokenData;
                    if (data && typeof data === 'object') {
                      contextString += `\n${token.toUpperCase()}:`;
                      if (data.name) contextString += ` ${data.name}`;
                      if (data.symbol) contextString += ` (${data.symbol})`;
                      if (data.price) contextString += ` - Price: $${typeof data.price === 'number' ? data.price.toFixed(data.price > 1 ? 2 : 6) : data.price}`;
                      if (data.change_24h) contextString += ` | 24h: ${data.change_24h > 0 ? '+' : ''}${data.change_24h.toFixed(2)}%`;
                      if (data.market_cap) contextString += ` | MCap: $${(data.market_cap/1e9).toFixed(2)}B`;
                      if (data.volume_24h) contextString += ` | Vol: $${(data.volume_24h/1e6).toFixed(1)}M`;
                      if (data.rank) contextString += ` | Rank: #${data.rank}`;
                    }
                  }
                });
              }
              
              // Process sentiment data
              if (context.sentiment_data) {
                contextString += '\n\n[Sentiment Data]:';
                Object.entries(context.sentiment_data).forEach(([token, tokenData]) => {
                  if (tokenData && typeof tokenData === 'object') {
                    // Handle nested data structure (data.data)
                    const data = tokenData.data || tokenData;
                    if (data && typeof data === 'object') {
                      contextString += `\n${token.toUpperCase()}:`;
                      if (data.sentiment_score) contextString += ` Sentiment: ${data.sentiment_score}`;
                      if (data.social_volume) contextString += ` | Social Volume: ${data.social_volume}`;
                    }
                  }
                });
              }
              
              // Process exchange data
              if (context.exchange_data) {
                contextString += '\n\n[Exchange Data]:';
                Object.entries(context.exchange_data).forEach(([token, tokenData]) => {
                  if (tokenData && typeof tokenData === 'object') {
                    const data = tokenData.data || tokenData;
                    if (data && typeof data === 'object') {
                      contextString += `\n${token.toUpperCase()}:`;
                      if (data.from_currency) contextString += ` From: ${data.from_currency}`;
                      if (data.to_currency) contextString += ` → To: ${data.to_currency}`;
                      if (data.exchange_rate) contextString += ` | Rate: ${data.exchange_rate}`;
                      if (data.available === false) contextString += ` | Status: Not Available`;
                    }
                  }
                });
              }
              
              // Process blockchain data
              if (context.blockchain_data) {
                contextString += '\n\n[Blockchain Data]:';
                Object.entries(context.blockchain_data).forEach(([chain, chainData]) => {
                  if (chainData && typeof chainData === 'object') {
                    const data = chainData.data || chainData;
                    if (data && typeof data === 'object') {
                      contextString += `\n${chain.toUpperCase()}:`;
                      if (data.token) contextString += ` Token: ${data.token}`;
                      if (data.price) contextString += ` | Price: $${data.price}`;
                      if (data.tps) contextString += ` | TPS: ${data.tps}`;
                      if (data.total_supply) contextString += ` | Supply: ${data.total_supply}`;
                    }
                  }
                });
              }
              
              // Process portfolio data
              if (context.portfolio_data) {
                contextString += '\n\n[Portfolio Data]:';
                Object.entries(context.portfolio_data).forEach(([key, portfolioData]) => {
                  if (portfolioData && typeof portfolioData === 'object') {
                    const data = portfolioData.data || portfolioData;
                    if (data && typeof data === 'object') {
                      if (data.connected) {
                        contextString += '\nWallet: Connected';
                        if (data.message) contextString += ` - ${data.message}`;
                      } else {
                        contextString += '\nWallet: Not Connected';
                      }
                      // Additional portfolio details can be added here when the bubble provides them
                      if (data.address) contextString += ` | Address: ${data.address}`;
                      if (data.balance) contextString += ` | Balance: ${data.balance}`;
                      if (data.chain) contextString += ` | Chain: ${data.chain}`;
                    }
                  }
                });
              }
              
              // Process LayerZero data
              if (context.layerzero_data) {
                contextString += '\n\n[LayerZero Bridge Data]:';
                Object.entries(context.layerzero_data).forEach(([key, layerzeroData]) => {
                  if (layerzeroData && typeof layerzeroData === 'object') {
                    const data = layerzeroData.data || layerzeroData;
                    if (data && typeof data === 'object') {
                      if (data.connected) {
                        contextString += '\nLayerZero: Available';
                        if (data.message) contextString += ` - ${data.message}`;
                      }
                      // Add bridge operation details if available
                      if (data.transactionHash) {
                        contextString += `\nRecent Bridge: ${data.token} ${data.amount} from ${data.fromChain} to ${data.toChain}`;
                        contextString += `\nStatus: ${data.status} | Fee: ${data.estimatedFee}`;
                      }
                    }
                  }
                });
              }
              
              // Add context to the message
              message.data.text = message.data.text + contextString;
              console.log(`💰 Enhanced message with cryptocurrency context for ${clientId}`);
            }
          }

          // Add AI function calling capabilities
          const enhancedMessage = await this.addFunctionCallingCapabilities(message);
          
          externalWs.send(JSON.stringify(enhancedMessage));
        } catch (error) {
          console.error(`Error forwarding message from client ${clientId}:`, error);
          externalWs.send(data.toString()); // Forward as-is if parsing fails
        }
      } else {
        // Queue message or send error if not connected
        console.warn(`⚠️ Cannot forward message from client ${clientId}: external connection not ready`);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'error',
            message: 'External service not connected. Please wait...',
            code: 'SERVICE_UNAVAILABLE'
          }));
        }
      }
    });

    clientWs.on('close', () => {
      console.log(`👋 Client WebSocket closed: ${clientId}`);
      this.cleanupConnection(clientId);
    });

    clientWs.on('error', (error) => {
      console.error(`🚨 Client WebSocket error for ${clientId}:`, error);
      this.cleanupConnection(clientId);
    });

    return connectionInfo;
  }

  /**
   * Send error message to client
   */
  sendErrorToClient(clientWs, message) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'error',
        message: message,
        code: 'PROXY_ERROR'
      }));
    }
  }

  /**
   * Clean up a proxy connection
   */
  cleanupConnection(clientId) {
    const connectionInfo = this.connections.get(clientId);
    if (connectionInfo) {
      if (connectionInfo.externalWs && connectionInfo.externalWs.readyState === WebSocket.OPEN) {
        connectionInfo.externalWs.close();
      }
      this.connections.delete(clientId);
      console.log(`🧹 Cleaned up connection for client: ${clientId}`);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const activeConnections = Array.from(this.connections.values()).filter(
      conn => conn.connected && conn.clientWs.readyState === WebSocket.OPEN
    ).length;

    return {
      totalConnections: this.connections.size,
      activeConnections,
      currentEndpoint: this.externalWsEndpoints[this.currentEndpointIndex],
      endpointIndex: this.currentEndpointIndex,
      availableEndpoints: this.externalWsEndpoints.length,
      externalEndpoints: this.externalWsEndpoints
    };
  }

  /**
   * Cleanup all connections (for server shutdown)
   */
  cleanup() {
    console.log('🧹 Cleaning up all WebSocket proxy connections...');
    for (const [clientId, connectionInfo] of this.connections.entries()) {
      if (connectionInfo.externalWs && connectionInfo.externalWs.readyState === WebSocket.OPEN) {
        connectionInfo.externalWs.close();
      }
      if (connectionInfo.clientWs && connectionInfo.clientWs.readyState === WebSocket.OPEN) {
        connectionInfo.clientWs.close();
      }
    }
    this.connections.clear();
  }
}

// Export singleton instance
export const websocketProxyService = new WebSocketProxyService();