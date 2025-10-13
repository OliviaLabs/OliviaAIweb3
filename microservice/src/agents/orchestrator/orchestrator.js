import { ReasoningAgent } from '../reasoning/index.js';
import { CallEverythingAgent } from '../api-selection/callEverythingAgent.js';
import { APIControlAgent } from '../api-control/index.js';
import { FrontendAgent } from '../frontend/index.js';
import { WebSearchReasoningAgent } from '../websearch-reasoning/index.js';
import { createTraceContext, globalMetrics } from '../../utils/trace.js';

/**
 * Multi-Agent Orchestrator
 * Coordinates the 3-agent pipeline to answer user questions
 * Now with full observability: tracing, metrics, structured logs
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
  static async process(userMessage, userContext = {}, conversationHistory = [], apiFetcher, traceId = null) {
    const trace = createTraceContext(traceId || 'no-trace', 'orchestrator');
    trace.info('Pipeline started', { message: userMessage });
    
    try {
      // STEP 1: Reasoning Agent understands intent
      const step1Logger = createTraceContext(traceId, 'reasoning-intent');
      step1Logger.info('Analyzing intent');
      const understanding = await ReasoningAgent.analyzeIntent(userMessage, conversationHistory, userContext);
      const step1Duration = step1Logger.complete({ understanding: understanding.user_wants });
      globalMetrics.recordLatency('reasoning-intent', step1Duration);
      
      // STEP 2: WebSearch Reasoning Agent (ALWAYS runs for every query)
      const step2Logger = createTraceContext(traceId, 'websearch-reasoning');
      step2Logger.info('Executing web search');
      const webSearchResults = await WebSearchReasoningAgent.processWebSearch(userMessage, understanding);
      const step2Duration = step2Logger.complete({ 
        isRealTime: webSearchResults.isRealTime,
        citationCount: webSearchResults.citations?.length || 0
      });
      globalMetrics.recordLatency('websearch-reasoning', step2Duration);
      
      // STEP 3: Call Everything Agent - calls ALL APIs for maximum data coverage
      const step3aLogger = createTraceContext(traceId, 'api-selection');
      step3aLogger.info('Selecting APIs');
      const apiCalls = await CallEverythingAgent.callEverything(understanding, userContext);
      const step3aDuration = step3aLogger.complete({ apiCallsPlanned: apiCalls.length });
      globalMetrics.recordLatency('api-selection', step3aDuration);
      
      // STEP 4: API Control Agent executes selected APIs
      const step4Logger = createTraceContext(traceId, 'api-execution');
      step4Logger.info('Executing APIs', { count: apiCalls.length });
      const rawData = await APIControlAgent.executeAPIs(apiCalls, apiFetcher);
      const step4Duration = step4Logger.complete({ dataFetched: Object.keys(rawData).length });
      globalMetrics.recordLatency('api-execution', step4Duration);
      
      // STEP 5: Reasoning Agent filters data
      const step5Logger = createTraceContext(traceId, 'data-filtering');
      step5Logger.info('Filtering data');
      const filteredData = ReasoningAgent.filterData(rawData, understanding);
      const step5Duration = step5Logger.complete({ filtered: Object.keys(filteredData.filtered || {}).length });
      globalMetrics.recordLatency('data-filtering', step5Duration);
      
      // STEP 6: Frontend Agent formats response (with web search results if available)
      const step6Logger = createTraceContext(traceId, 'response-formatting');
      step6Logger.info('Formatting response', { hasWebSearch: !!webSearchResults });
      const response = await FrontendAgent.formatResponse(
        userMessage,
        filteredData,
        understanding,
        conversationHistory,
        userContext,
        webSearchResults // Pass web search results to Frontend Agent!
      );
      const step6Duration = step6Logger.complete({ responseLength: response.length });
      globalMetrics.recordLatency('response-formatting', step6Duration);
      
      const totalDuration = trace.complete({ success: true });
      
      return {
        success: true,
        response,
        metadata: {
          understanding: understanding.user_wants,
          reasoning: understanding.reasoning,
          dataUsed: Object.keys(filteredData.filtered || {}),
          urgency: understanding.urgency,
          apiCallsMade: apiCalls.length,
          traceId,
          durationMs: totalDuration
        }
      };
      
    } catch (error) {
      trace.error('Pipeline failed', error);
      
      return {
        success: false,
        response: 'I apologize, but I encountered an issue processing your request. Could you try rephrasing your question?',
        error: error.message,
        traceId
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
  static async processWithStreaming(userMessage, userContext, conversationHistory, apiFetcher, onChunk, traceId = null) {
    // Run the pipeline with tracing
    const result = await this.process(userMessage, userContext, conversationHistory, apiFetcher, traceId);
    
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

