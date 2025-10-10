import { ReasoningAgent } from '../reasoning/index.js';
import { CallEverythingAgent } from '../api-selection/callEverythingAgent.js';
import { APIControlAgent } from '../api-control/index.js';
import { FrontendAgent } from '../frontend/index.js';

/**
 * Multi-Agent Orchestrator
 * Coordinates the 3-agent pipeline to answer user questions
 */
export class AgentOrchestrator {
  
  /**
   * Process a user message through the complete multi-agent pipeline
   * @param {string} userMessage - User's question
   * @param {object} userContext - User context (wallet address, etc.)
   * @param {Array} conversationHistory - Previous messages
   * @param {Function} apiFetcher - Function to make API calls
   * @returns {Promise<object>} Response and metadata
   */
  static async process(userMessage, userContext = {}, conversationHistory = [], apiFetcher) {
    console.log('\n🚀 ============================================');
    console.log('🚀 MULTI-AGENT PIPELINE STARTED');
    console.log('🚀 ============================================\n');
    console.log('📝 User message:', userMessage);
    
    try {
      // STEP 1: Reasoning Agent understands intent
      console.log('\n--- STEP 1: REASONING AGENT ---');
      const understanding = await ReasoningAgent.analyzeIntent(userMessage, conversationHistory, userContext);
      
      // STEP 2: Call Everything Agent - calls ALL APIs for maximum data coverage
      console.log('\n--- STEP 2: CALL EVERYTHING AGENT (Maximum Data Coverage) ---');
      const apiCalls = await CallEverythingAgent.callEverything(understanding, userContext);
      
      // STEP 3: API Control Agent executes selected APIs
      console.log('\n--- STEP 3: API CONTROL AGENT (Executor) ---');
      const rawData = await APIControlAgent.executeAPIs(apiCalls, apiFetcher);
      
      // STEP 4: Reasoning Agent filters data
      console.log('\n--- STEP 4: REASONING AGENT (Filter) ---');
      const filteredData = ReasoningAgent.filterData(rawData, understanding);
      
      // STEP 5: Frontend Agent formats response
      console.log('\n--- STEP 5: FRONTEND AGENT ---');
      const response = await FrontendAgent.formatResponse(
        userMessage,
        filteredData,
        understanding,
        conversationHistory,
        userContext
      );
      
      console.log('\n🎉 ============================================');
      console.log('🎉 MULTI-AGENT PIPELINE COMPLETED');
      console.log('🎉 ============================================\n');
      
      return {
        success: true,
        response,
        metadata: {
          understanding: understanding.user_wants,
          reasoning: understanding.reasoning,
          dataUsed: Object.keys(filteredData.filtered || {}),
          urgency: understanding.urgency,
          apiCallsMade: apiCalls.length
        }
      };
      
    } catch (error) {
      console.error('\n❌ ============================================');
      console.error('❌ MULTI-AGENT PIPELINE ERROR');
      console.error('❌ ============================================');
      console.error('Error:', error);
      
      return {
        success: false,
        response: 'I apologize, but I encountered an issue processing your request. Could you try rephrasing your question?',
        error: error.message
      };
    }
  }

  /**
   * Process with streaming response
   * @param {string} userMessage - User's question
   * @param {object} userContext - User context
   * @param {Array} conversationHistory - Previous messages
   * @param {Function} apiFetcher - Function to make API calls
   * @param {Function} onChunk - Callback for each response chunk
   * @returns {Promise<object>} Final result
   */
  static async processWithStreaming(userMessage, userContext, conversationHistory, apiFetcher, onChunk) {
    // Run the pipeline
    const result = await this.process(userMessage, userContext, conversationHistory, apiFetcher);
    
    if (result.success) {
      // Stream the response word-by-word
      await FrontendAgent.streamResponse(result.response, onChunk);
    } else {
      // Send error message
      onChunk(result.response);
    }
    
    return result;
  }
}

