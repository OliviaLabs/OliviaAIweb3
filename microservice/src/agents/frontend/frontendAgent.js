import OpenAI from 'openai';
import { config } from '../../config/config.js';
import { DataAnalyzer } from '../utils/dataAnalyzer.js';

// Configure OpenAI client for Azure or standard OpenAI
const openai = config.azureOpenAIKey
  ? new OpenAI({
      apiKey: config.azureOpenAIKey,
      baseURL: `${config.azureOpenAIEndpoint}openai/deployments/${config.azureOpenAIDeployment}`,
      defaultQuery: { 'api-version': config.azureOpenAIVersion },
      defaultHeaders: { 'api-key': config.azureOpenAIKey },
    })
  : new OpenAI({ apiKey: config.openaiApiKey });

/**
 * Frontend Agent
 * Formats data into natural, conversational responses for users
 */
export class FrontendAgent {
  
  /**
   * Generate a natural language response from filtered data
   * @param {string} userMessage - Original user question
   * @param {object} filteredData - Filtered data from Reasoning Agent
   * @param {object} understanding - User understanding from Reasoning Agent
   * @param {Array} conversationHistory - Previous messages
   * @param {object} userContext - User context with plugin data
   * @param {object} webSearchResults - Real-time web search results (optional)
   * @returns {Promise<string>} Natural language response
   */
  static async formatResponse(userMessage, filteredData, understanding, conversationHistory = [], userContext = {}, webSearchResults = null) {
    console.log('💬 [Frontend Agent] Formatting response for user...');
    
    try {
      // Merge cached plugin data with fresh API data
      const allAvailableData = {
        ...userContext.pluginData, // Cached data from plugins
        ...filteredData.filtered    // Fresh data from API calls
      };
      
      // Analyze data relationships for comprehensive insights
      const dataAnalysis = DataAnalyzer.analyzeDataRelationships(allAvailableData, understanding);
      
      // Extract language from context for multilingual support
      const userLanguage = userContext.language || 'English';
      
      // Extract previously mentioned items for follow-up intelligence
      const previouslyMentioned = this.extractPreviouslyMentionedItems(conversationHistory);
      
      console.log('💬 [Frontend Agent] Context:', {
        language: userLanguage,
        isFollowUp: understanding.is_follow_up,
        previousItemsCount: previouslyMentioned.length,
        hasWebSearch: !!webSearchResults,
        webSearchIsRealTime: webSearchResults?.isRealTime
      });
      
      // Build web search context if available
      let webSearchContext = '';
      if (webSearchResults && webSearchResults.success) {
        webSearchContext = `\n\n🌐 REAL-TIME WEB SEARCH RESULTS (${webSearchResults.isRealTime ? 'LIVE from the web' : 'from AI knowledge'}):\n`;
        webSearchContext += `Query optimized: "${webSearchResults.originalQuery}" → "${webSearchResults.optimizedQuery}"\n`;
        webSearchContext += `\nSearch Results:\n${webSearchResults.searchResults}\n`;
        if (webSearchResults.citations && webSearchResults.citations.length > 0) {
          webSearchContext += `\nSources: ${webSearchResults.citations.slice(0, 3).join(', ')}\n`;
        }
        webSearchContext += `\n⚠️ IMPORTANT: This is ${webSearchResults.isRealTime ? 'CURRENT, REAL-TIME' : 'NOT real-time'} information. Use this as your PRIMARY source for answering the user's question about recent events.\n`;
      }
      
      // Convert merged data to a readable format
      const dataContext = Object.keys(allAvailableData).length > 0
        ? `\n\nAVAILABLE DATA (from plugins + APIs):\n${JSON.stringify(allAvailableData, null, 2)}\n\n${dataAnalysis.comprehensiveSummary}`
        : '\n\nNo specific data available, provide general guidance.';
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Olivia, a helpful crypto trading assistant having a natural conversation.

🌐 RESPOND IN: ${userLanguage}
Use the user's language naturally and fluently.

WHAT THE USER WANTS:
${understanding.user_wants}

YOUR REASONING:
${understanding.reasoning}

${understanding.is_follow_up ? `
⚠️ THIS IS A FOLLOW-UP QUESTION:
The user is continuing the conversation about: ${understanding.continuation_context || 'the previous topic'}
PREVIOUSLY MENTIONED ITEMS (DO NOT REPEAT THESE): ${previouslyMentioned.join(', ') || 'none'}
Show DIFFERENT items from the data that were NOT already mentioned.
` : ''}

${webSearchContext}

${dataContext}

YOUR JOB:
- Answer naturally like a knowledgeable friend, no formal structure
- Use the available data but don't cite sources - just share the info naturally
- NO markdown formatting (no **bold**, no numbered lists, no headings)
- If the answer isn't in the data, say you don't have that info
- Keep it conversational and flowing like a text message
- Be enthusiastic about crypto but realistic
- When showing lists (tokens, coins, etc.): Show 10-15 items, not just 5 - give comprehensive info!

COMPREHENSIVE ANALYSIS REQUIRED:
- Analyze ALL available data holistically across multiple sources
- Identify patterns, correlations, and insights across different data sources
- Provide comprehensive analysis with multiple data points and examples
- Connect different data sources to tell a complete story
- Give users "many points" and "examples" as requested
- Look for relationships between price data, sentiment, volume, and trending information
- Cross-reference data from different APIs to provide deeper insights

📋 CONVERSATION CONTINUITY (CRITICAL):
- Check conversation history to see what you ALREADY mentioned
- If you already listed specific tokens/items, DON'T repeat them
- When asked for "more" or "other ones", show DIFFERENT items from the available data
- Track what you've said and show the NEXT items in the list
- Example: If you showed tokens 1-5, now show tokens 6-10 from the same dataset

🚨 ANTI-HALLUCINATION RULES:
1. NEVER make up platform/chain information - only extract it from the "platforms" or "asset_platform_id" fields in the data
2. NEVER guess token standards (ERC-20, BEP-20, etc.) - only state them if explicitly in the data
3. If blockchain/chain info is missing from the data, say "The blockchain information isn't available in the current data"
4. DO NOT use general knowledge to fill gaps - ONLY use the provided data
5. CRITICAL: If data is about a specific blockchain (e.g. TON), ONLY mention tokens that are actually on that blockchain according to the data

PERSONALITY:
- Friendly and approachable
- Knowledgeable but not condescending
- Honest when uncertain
- Enthusiastic but balanced

RESPONSE STYLE:
- Write like you're texting a friend
- No citations like "According to..." or "Based on..."
- No formal structure or headings
- Just natural flowing conversation

Respond naturally to the user's question using the available data.`
          },
          ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const formattedResponse = response.choices[0].message.content;
      
      console.log('💬 [Frontend Agent] Response generated:', formattedResponse.substring(0, 100) + '...');
      
      return formattedResponse;
      
    } catch (error) {
      console.error('💬 [Frontend Agent] Error:', error);
      
      // Fallback response
      return `I understand you're asking about ${understanding.user_wants.toLowerCase()}. I'm having trouble accessing the data right now, but I'm here to help! Could you try asking again?`;
    }
  }

  /**
   * Stream response word-by-word for better UX
   * @param {string} response - Full response text
   * @param {Function} onChunk - Callback for each word
   * @returns {Promise<void>}
   */
  static async streamResponse(response, onChunk) {
    const words = response.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      onChunk(word);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Extract items previously mentioned in conversation for follow-up intelligence
   * @param {Array} conversationHistory - Previous messages
   * @returns {Array} - List of previously mentioned items (tokens, names, etc.)
   */
  static extractPreviouslyMentionedItems(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return [];
    }

    const mentionedItems = new Set();
    
    // Look at assistant's last 2 messages
    const recentAssistantMessages = conversationHistory
      .filter(msg => msg.role === 'assistant')
      .slice(-2);

    for (const msg of recentAssistantMessages) {
      if (!msg.content) continue;

      // Extract token symbols (2-5 uppercase letters)
      const tokens = msg.content.match(/\b[A-Z]{2,5}\b/g) || [];
      tokens.forEach(t => mentionedItems.add(t));

      // Extract common token names (Bitcoin, Ethereum, etc.)
      const tokenNames = ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Polkadot', 'Avalanche', 'Polygon', 'Chainlink'];
      for (const name of tokenNames) {
        if (msg.content.includes(name)) {
          mentionedItems.add(name);
        }
      }
    }

    return Array.from(mentionedItems);
  }
}

