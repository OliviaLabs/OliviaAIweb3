# Olivia AI - Implementation Part 2
## Controllers, Routes, and Frontend Integration

---

## Step 1.5: Create Agent Controller

**File**: `microservice/src/controllers/agentController.js`

```javascript
import intentAgent from '../agents/intentAgent.js';
import dataRouterService from '../services/dataRouterService.js';
import analystAgent from '../agents/analystAgent.js';
import responseAgent from '../agents/responseAgent.js';

class AgentController {
  
  /**
   * Main agent orchestration endpoint
   * POST /api/agent/chat
   */
  static async chat(req, res) {
    const startTime = Date.now();
    
    try {
      const { 
        message, 
        conversationHistory = [],
        activeToken = null,
        userWallet = null
      } = req.body;
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🤖 [Agent System] New query:', message);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 1: INTENT CLASSIFICATION
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log('STEP 1: Intent Classification');
      const intent = await intentAgent.classify(
        message,
        conversationHistory,
        activeToken,
        userWallet
      );
      
      if (intent.confidence < 0.3) {
        console.log('⚠️ Low confidence intent, may need clarification');
      }
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 2: DATA ROUTING
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log('\nSTEP 2: Data Routing');
      const routingPlan = dataRouterService.route(intent);
      
      if (routingPlan.api_calls.length === 0) {
        console.log('⚠️ No API calls planned, skipping to response');
        
        // Skip to response with intent only
        const response = await responseAgent.generate(
          {
            answer_to_user_question: {
              primary_answer: "I understand your question. Let me help you with that.",
              secondary_insights: [],
              risk_warnings: []
            }
          },
          message,
          conversationHistory
        );
        
        return res.json({
          success: true,
          data: {
            message: response,
            intent: intent,
            debug: {
              steps_completed: ['intent', 'response'],
              total_time: Date.now() - startTime
            }
          }
        });
      }
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 3: EXECUTE API CALLS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log('\nSTEP 3: Executing API Calls');
      const rawData = await dataRouterService.execute(routingPlan);
      
      if (rawData.summary && rawData.summary.successful === 0) {
        console.log('❌ All API calls failed, falling back to generic response');
        
        const response = await responseAgent.generate(
          {
            answer_to_user_question: {
              primary_answer: "I'm having trouble fetching the latest data right now. Please try again in a moment.",
              secondary_insights: [],
              risk_warnings: []
            }
          },
          message,
          conversationHistory
        );
        
        return res.json({
          success: true,
          data: {
            message: response,
            intent: intent,
            debug: {
              steps_completed: ['intent', 'routing', 'api_calls_failed', 'response'],
              total_time: Date.now() - startTime
            }
          }
        });
      }
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 4: ANALYSIS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log('\nSTEP 4: Data Analysis');
      const analysis = await analystAgent.analyze(
        rawData,
        message,
        intent
      );
      
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STEP 5: RESPONSE GENERATION
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      console.log('\nSTEP 5: Response Generation');
      const response = await responseAgent.generate(
        analysis,
        message,
        conversationHistory
      );
      
      const totalTime = Date.now() - startTime;
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ [Agent System] Complete in ${totalTime}ms`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Return full response with debug info
      return res.json({
        success: true,
        data: {
          message: response,
          intent: intent,
          analysis: analysis,
          raw_data: rawData,
          debug: {
            steps_completed: ['intent', 'routing', 'api_calls', 'analysis', 'response'],
            api_calls_made: routingPlan.api_calls.length,
            api_calls_successful: rawData.summary?.successful || 0,
            total_time: totalTime
          }
        }
      });
      
    } catch (error) {
      console.error('❌ [Agent System] Fatal error:', error);
      
      return res.status(500).json({
        success: false,
        error: error.message,
        message: 'Agent system encountered an error'
      });
    }
  }
  
  /**
   * Health check for agent system
   * GET /api/agent/health
   */
  static async health(req, res) {
    try {
      const status = {
        agent_system: 'operational',
        agents: {
          intent: 'ready',
          data_router: 'ready',
          analyst: 'ready',
          response: 'ready'
        },
        api_integrations: {
          coingecko: 'available',
          twitter: 'available',
          protokols: 'available',
          // ... check all services
        }
      };
      
      res.json({
        success: true,
        data: status
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Test intent classification only
   * POST /api/agent/test-intent
   */
  static async testIntent(req, res) {
    try {
      const { message, conversationHistory, activeToken, userWallet } = req.body;
      
      const intent = await intentAgent.classify(
        message,
        conversationHistory,
        activeToken,
        userWallet
      );
      
      res.json({
        success: true,
        data: {
          message: message,
          intent: intent
        }
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default AgentController;
```

---

## Step 1.6: Create Agent Routes

**File**: `microservice/src/routes/agentRoutes.js`

```javascript
import express from 'express';
import AgentController from '../controllers/agentController.js';

const router = express.Router();

// Main agent chat endpoint
router.post('/chat', AgentController.chat);

// Health check
router.get('/health', AgentController.health);

// Test endpoints (for development)
router.post('/test-intent', AgentController.testIntent);

export default router;
```

---

## Step 1.7: Register Agent Routes

**Modify**: `microservice/src/routes/index.js`

```javascript
import agentRoutes from './agentRoutes.js';

// ... existing imports ...

const router = express.Router();

// NEW: Agent system routes (priority #1)
router.use('/agent', agentRoutes);

// ... existing routes ...

// Update documentation
router.get('/', (req, res) => {
  res.json({
    service: 'OpenAI Microservice',
    version: '2.0.0',
    endpoints: {
      // NEW AGENT SYSTEM
      agent: {
        chat: '/api/agent/chat',
        health: '/api/agent/health',
        testIntent: '/api/agent/test-intent'
      },
      
      // Legacy endpoints (still available)
      health: '/api/health',
      openai: {
        chatCompletions: '/api/openai/chat/completions', // OLD SYSTEM
        // ...
      },
      // ...
    }
  });
});
```

---

## PHASE 2: FRONTEND INTEGRATION

### Step 2.1: Create Agent Service

**File**: `src/api/services/agentService.js`

```javascript
import { getAuthHeaders } from '../../auth/utils/authUtils';

const AGENT_API_URL = import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 'https://oliviaaiweb3-1.onrender.com';

class AgentService {
  
  /**
   * Send message to agent system
   * @param {string} message - User message
   * @param {Array} conversationHistory - Last 10 messages
   * @param {Object} activeToken - Currently active token
   * @param {string} userWallet - User's wallet address
   * @returns {Promise<Object>} Agent response
   */
  async chat(message, conversationHistory = [], activeToken = null, userWallet = null) {
    console.log('🤖 [Agent Service] Sending to agent system:', message);
    
    try {
      const response = await fetch(`${AGENT_API_URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10), // Last 10 messages only
          activeToken,
          userWallet
        })
      });
      
      if (!response.ok) {
        throw new Error(`Agent API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Agent request failed');
      }
      
      console.log('✅ [Agent Service] Response received');
      console.log('   Intent:', data.data.intent.intent_type);
      console.log('   API calls:', data.data.debug.api_calls_made);
      console.log('   Time:', data.data.debug.total_time + 'ms');
      
      return data.data;
      
    } catch (error) {
      console.error('❌ [Agent Service] Error:', error);
      throw error;
    }
  }
  
  /**
   * Health check
   */
  async checkHealth() {
    try {
      const response = await fetch(`${AGENT_API_URL}/api/agent/health`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('❌ [Agent Service] Health check failed:', error);
      return false;
    }
  }
  
  /**
   * Test intent classification (dev only)
   */
  async testIntent(message, conversationHistory, activeToken) {
    try {
      const response = await fetch(`${AGENT_API_URL}/api/agent/test-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
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
```

---

### Step 2.2: Integrate Agent Service in Home.jsx

**Modify**: `src/pages/Home.jsx`

Add import:
```javascript
import agentService from '../api/services/agentService';
```

Replace the AI call section (around line 3822-3900) with:

```javascript
// 🚀 SEND TO AGENT SYSTEM (replaces old OpenAI direct call)
try {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 Sending to Agent System');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Build conversation history for agent
  const conversationHistory = messages.map(msg => ({
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
  
  console.log('📝 Conversation history:', conversationHistory.length, 'messages');
  console.log('🎯 Active token:', activeToken);
  console.log('💰 Wallet:', walletAddress);
  
  // Call agent system
  const agentResponse = await agentService.chat(
    message,
    conversationHistory,
    activeToken,
    walletAddress
  );
  
  console.log('✅ Agent response received');
  console.log('   Intent type:', agentResponse.intent.intent_type);
  console.log('   Confidence:', agentResponse.intent.confidence);
  console.log('   API calls made:', agentResponse.debug.api_calls_made);
  console.log('   Time taken:', agentResponse.debug.total_time + 'ms');
  
  const aiMessage = agentResponse.message;
  
  // Add AI response to messages
  setMessages(prev => [...prev, { type: 'ai', content: aiMessage }]);
  
  // Broadcast to BottomNavigation
  window.dispatchEvent(new CustomEvent('chatUpdate', {
    detail: {
      msg: message,
      response: aiMessage,
      isTyping: false
    }
  }));
  
  // 🎨 OPTIONAL: Trigger bubbles based on intent
  // Now that we have structured intent, we can trigger specific bubbles
  if (agentResponse.intent.target.tokens) {
    console.log('🎈 Triggering bubbles for tokens:', agentResponse.intent.target.tokens);
    
    // You can use the raw_data from agent response to populate bubbles
    // without making redundant API calls!
    if (agentResponse.raw_data.by_service.coingecko) {
      // Create CoinGecko bubble with pre-fetched data
      // (implementation similar to existing bubble creation)
    }
    
    if (agentResponse.raw_data.by_service.twitter) {
      // Create Twitter bubble with pre-fetched data
    }
    
    // etc...
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
} catch (error) {
  console.error('❌ Agent system error:', error);
  
  // Fallback to old system or show error
  const errorMessage = 'Sorry, I\'m having trouble connecting right now. Please try again.';
  
  setMessages(prev => [...prev, { type: 'ai', content: errorMessage }]);
  
  window.dispatchEvent(new CustomEvent('chatUpdate', {
    detail: {
      msg: message,
      response: errorMessage,
      isTyping: false
    }
  }));
}

setIsLoading(false);
```

---

## Step 2.3: Add Loading States

Add these state variables to `Home.jsx`:

```javascript
const [agentStatus, setAgentStatus] = useState('idle'); // idle | classifying | routing | fetching | analyzing | responding

// In the agent call:
setAgentStatus('classifying');
// ... after intent ...
setAgentStatus('fetching');
// ... after API calls ...
setAgentStatus('analyzing');
// ... after analysis ...
setAgentStatus('responding');
// ... after response ...
setAgentStatus('idle');
```

Then in your UI (or BottomNavigation), show status:

```javascript
{agentStatus !== 'idle' && (
  <div className="text-xs text-gray-400 mt-1">
    {agentStatus === 'classifying' && '🧠 Understanding your question...'}
    {agentStatus === 'routing' && '🗺️ Planning data fetch...'}
    {agentStatus === 'fetching' && '📡 Fetching from 21 APIs...'}
    {agentStatus === 'analyzing' && '🔬 Analyzing data...'}
    {agentStatus === 'responding' && '✍️ Crafting response...'}
  </div>
)}
```

---

## PHASE 3: TESTING

### Test Case 1: "What's pumping on TON?"

**Expected Behavior**:
1. Intent Agent classifies as `trending_ecosystem` with `blockchain: TON`
2. Data Router calls: TON Center, Protokols, Twitter
3. Analyst extracts top tokens: DOGS, NOT, STON
4. Response mentions all 3 with specific percentages

**Test**:
```bash
curl -X POST http://localhost:3001/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What'\''s pumping on TON?",
    "conversationHistory": []
  }'
```

---

### Test Case 2: "Why is Corn pumping?"

**Expected Behavior**:
1. Intent Agent classifies as `causal_analysis` with `tokens: [CORN]`
2. Data Router calls: CoinGecko, Twitter, CryptoPanic, Lurky
3. Analyst finds: price data, tweets, news catalyst
4. Response explains WHY with evidence

**Test**:
```bash
curl -X POST http://localhost:3001/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Why is Corn pumping?",
    "conversationHistory": []
  }'
```

---

### Test Case 3: Follow-up "yeah"

**Expected Behavior**:
1. Intent Agent sees previous message mentioned "Corn"
2. Classifies as `follow_up` with `references_previous_token: CORN`
3. Data Router fetches CORN data
4. Response provides details about Corn

**Test**:
```bash
curl -X POST http://localhost:3001/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "yeah",
    "conversationHistory": [
      {"role": "assistant", "content": "Have you seen Corn pumping? It'\''s up 5.48%"},
      {"role": "user", "content": "yeah"}
    ]
  }'
```

---

## PHASE 4: DEPLOYMENT

### Step 4.1: Environment Variables

Add to `.env` (both root and microservice):

```env
# Agent System
ENABLE_AGENT_SYSTEM=true
AGENT_DEBUG_MODE=false
AGENT_CACHE_TTL=300
```

### Step 4.2: Deploy to Render

1. Push all changes to GitHub
2. Render will auto-deploy microservice
3. Test on live URL: https://oliviaaiweb3-1.onrender.com/api/agent/health

### Step 4.3: Monitor

Watch logs for:
- ✅ `[Agent System] Complete in Xms` (should be < 5000ms)
- ✅ `Intent Agent] Classified as: X` (check accuracy)
- ✅ `[Data Router] Results: X/Y successful` (should be > 50%)
- ❌ Any errors or timeouts

---

## ROLLBACK PLAN

If agent system has issues:

1. **Frontend Fallback**:
```javascript
// In Home.jsx
const USE_AGENT_SYSTEM = false; // Set to false to use old system

if (USE_AGENT_SYSTEM) {
  // Agent call
} else {
  // Old OpenAI direct call
}
```

2. **Backend Fallback**:
Keep `/api/openai/chat/completions` endpoint unchanged as backup

3. **Gradual Rollout**:
```javascript
// Random 50% of users get agent system
const USE_AGENT_SYSTEM = Math.random() > 0.5;
```

---

## SUCCESS CHECKLIST

### Accuracy Tests:
- [ ] "What's pumping on TON?" returns TON ecosystem tokens (not TON token)
- [ ] "Why is Corn pumping?" provides specific reasons with evidence
- [ ] "yeah" after token mention correctly interprets context
- [ ] "Compare BTC and ETH" fetches both and compares
- [ ] "Should I buy X?" includes risk assessment

### Performance Tests:
- [ ] Total response time < 5 seconds
- [ ] At least 50% of API calls succeed
- [ ] No timeout errors under normal load
- [ ] Frontend doesn't freeze during agent processing

### Quality Tests:
- [ ] Responses cite specific numbers
- [ ] No emojis in responses
- [ ] No section headers (**PRICE:**)
- [ ] Natural, conversational tone
- [ ] Quotes actual tweets when available

### Error Handling Tests:
- [ ] Gracefully handles all APIs failing
- [ ] Fallback to old system works
- [ ] Clear error messages to user
- [ ] No crashes or unhandled rejections

---

## NEXT ENHANCEMENTS

After core system is stable:

1. **Caching Layer**:
   - Cache intent classifications for identical queries
   - Cache API responses (1-5 min TTL)
   - Redis integration

2. **Multi-Turn Reasoning**:
   - Agent can request more data mid-conversation
   - "Let me check X..." and make additional API call

3. **Portfolio Integration**:
   - Auto-calculate P&L when token is in user's portfolio
   - "You hold 100 CORN worth $12.74, up $3.45 today"

4. **Proactive Insights**:
   - Background job checks portfolio tokens
   - Triggers notification if any pump >20%

5. **Learning System**:
   - Track which API combinations work best
   - Optimize routing based on success rates
   - A/B test different prompts

---

## ESTIMATED TIMELINE

- **Phase 1** (Backend Agents): 2-3 days
- **Phase 2** (Frontend Integration): 1 day
- **Phase 3** (Testing): 1-2 days
- **Phase 4** (Deployment): 0.5 day
- **Buffer**: 1 day

**Total**: 5-7 days for full implementation and testing

---

## CONCLUSION

This multi-agent architecture will transform Olivia AI from a reactive chatbot into an intelligent analyst that:

✅ Understands nuanced intent  
✅ Fetches only relevant data  
✅ Provides deep, evidence-based insights  
✅ Maintains context across conversations  
✅ Responds naturally and professionally  

**Ready to start Phase 1?**

