import intentAgent from '../agents/intentAgent.js';
import dataRouterService from '../services/dataRouterService.js';
import analystAgent from '../agents/analystAgent.js';
import responseAgent from '../agents/responseAgent.js';

class AgentController {
  
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
      
      // STEP 1: INTENT CLASSIFICATION
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
      
      // ⚡ SHORT-CIRCUIT: Skip data fetching for greetings and general queries
      if (intent.intent_type === 'general' && intent.context.urgency === 'low') {
        console.log('⚡ [Agent Controller] Greeting detected - skipping data fetching');
        
        const greetingResponse = await responseAgent.generate(
          {
            answer_to_user_question: {
              primary_answer: "Hey! How can I help you today? Ask me about any crypto token, trending coins, or your portfolio.",
              secondary_insights: [],
              risk_warnings: []
            }
          },
          message,
          conversationHistory
        );
        
        const totalTime = Date.now() - startTime;
        console.log(`\n⚡ [Agent Controller] Complete in ${totalTime}ms (fast-path)\n`);
        
        return res.json({
          success: true,
          data: {
            message: greetingResponse,
            intent: intent,
            raw_data: null,
            debug: {
              steps_completed: ['intent', 'response'],
              api_calls_made: 0,
              api_calls_successful: 0,
              total_time: totalTime,
              fast_path: true
            }
          }
        });
      }
      
      // STEP 2: DATA ROUTING
      console.log('\nSTEP 2: Data Routing');
      const routingPlan = dataRouterService.route(intent);
      
      if (routingPlan.api_calls.length === 0) {
        console.log('⚠️ No API calls planned, skipping to response');
        
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
      
      // STEP 3: EXECUTE API CALLS
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
      
      // STEP 4: ANALYSIS
      console.log('\nSTEP 4: Data Analysis');
      const analysis = await analystAgent.analyze(
        rawData,
        message,
        intent
      );
      
      // STEP 5: RESPONSE GENERATION
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
      
      // ✅ Explicitly set CORS headers to override any caching
      res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
      
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
  
  static async health(req, res) {
    try {
      const status = {
        agent_system: 'operational',
        agents: {
          intent: 'ready',
          data_router: 'ready',
          analyst: 'ready',
          response: 'ready'
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
