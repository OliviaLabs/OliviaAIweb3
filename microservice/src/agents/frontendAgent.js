import OpenAI from 'openai';
import { config } from '../config/config.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

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
   * @returns {Promise<string>} Natural language response
   */
  static async formatResponse(userMessage, filteredData, understanding, conversationHistory = [], userContext = {}) {
    console.log('💬 [Frontend Agent] Formatting response for user...');
    
    try {
      // Merge cached plugin data with fresh API data
      const allAvailableData = {
        ...userContext.pluginData, // Cached data from plugins
        ...filteredData.filtered    // Fresh data from API calls
      };
      
      // Convert merged data to a readable format
      const dataContext = Object.keys(allAvailableData).length > 0
        ? `\n\nAVAILABLE DATA (from plugins + APIs):\n${JSON.stringify(allAvailableData, null, 2)}`
        : '\n\nNo specific data available, provide general guidance.';
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Olivia, a helpful crypto trading assistant having a natural conversation.

WHAT THE USER WANTS:
${understanding.user_wants}

YOUR REASONING:
${understanding.reasoning}

${understanding.is_follow_up ? `
⚠️ THIS IS A FOLLOW-UP QUESTION:
The user is continuing the conversation about: ${understanding.continuation_context || 'the previous topic'}
Check conversation history to see what you ALREADY mentioned, then show DIFFERENT items from the data.
` : ''}

${dataContext}

YOUR JOB:
- Answer naturally like a knowledgeable friend, no formal structure
- Use the available data but don't cite sources - just share the info naturally
- NO markdown formatting (no **bold**, no numbered lists, no headings)
- If the answer isn't in the data, say you don't have that info
- Keep it conversational and flowing like a text message
- Be enthusiastic about crypto but realistic
- When showing lists (tokens, coins, etc.): Show 10-15 items, not just 5 - give comprehensive info!

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
}
