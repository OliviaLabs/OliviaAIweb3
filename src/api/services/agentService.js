import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints.js';

class AgentService {
  
  async chat(message, conversationHistory = [], activeToken = null, userWallet = null) {
    console.log('🤖 [Agent Service] Sending to agent system:', message);
    
    try {
      // ⏱️ Add 60-second timeout for multi-agent processing (increased while optimizing speed)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10),
          activeToken,
          userWallet
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Agent API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Agent request failed');
      }
      
      console.log('✅ [Agent Service] Response received');
      console.log('   Intent:', data.data.intent.intent_type);
      console.log('   Confidence:', data.data.intent.confidence);
      console.log('   API calls:', data.data.debug.api_calls_made);
      console.log('   Successful:', data.data.debug.api_calls_successful);
      console.log('   Time:', data.data.debug.total_time + 'ms');
      
      return data.data;
      
    } catch (error) {
      console.error('❌ [Agent Service] Error:', error);
      throw error;
    }
  }
  
  async checkHealth() {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/agent/health`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('❌ [Agent Service] Health check failed:', error);
      return false;
    }
  }
  
  async testIntent(message, conversationHistory, activeToken) {
    try {
      const response = await fetch(`${OPENAI_MICROSERVICE_CONFIG.URL}/api/agent/test-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_MICROSERVICE_CONFIG.TOKEN}`,
          'Origin': window.location.origin
        },
        body: JSON.stringify({ message, conversationHistory, activeToken })
      });
      
      const data = await response.json();
      return data.data.intent;
      
    } catch (error) {
      console.error('❌ [Agent Service] Test intent failed:', error);
      return null;
    }
  }
}

export default new AgentService();
