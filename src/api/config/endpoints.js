export const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'https://api.example.com';
export const API_GATEWAY_JWT = import.meta.env.VITE_API_GATEWAY_JWT;

// Secure OpenAI Microservice Configuration
const OPENAI_MICROSERVICE_URL = import.meta.env.VITE_OPENAI_MICROSERVICE_URL || (window.location.hostname === 'oliviaaiweb3-1.onrender.com' ? 'https://oliviaaiweb3-1.onrender.com' : 'http://localhost:3000');

// Debug log to see what URL is being used
console.log('🔍 OpenAI Microservice URL:', OPENAI_MICROSERVICE_URL);
console.log('🔍 Environment variable:', import.meta.env.VITE_OPENAI_MICROSERVICE_URL);
console.log('🔍 Hostname:', window.location.hostname);
// Get token from environment variable - MUST be set in .env
const OPENAI_MICROSERVICE_TOKEN = import.meta.env.VITE_APP_ACCESS_TOKEN;

// Debug: Verify token is loaded
if (OPENAI_MICROSERVICE_TOKEN) {
  console.log('✅ Auth Token loaded:', OPENAI_MICROSERVICE_TOKEN.substring(0, 10) + '...' + OPENAI_MICROSERVICE_TOKEN.substring(OPENAI_MICROSERVICE_TOKEN.length - 10));
} else {
  console.error('❌ CRITICAL: VITE_APP_ACCESS_TOKEN not found in environment!');
  console.error('❌ This means the .env file was not loaded during build.');
  console.error('❌ Render needs to rebuild with the environment variable set.');
}
const SECURE_WEBSOCKET_URL = OPENAI_MICROSERVICE_URL.replace('http', 'ws') + '/ws/secure-proxy';

// Streamlined endpoints - only what's actually used
export const ENDPOINTS = {
    // AI Chat WebSocket - USED by WebSocketContext
    WEBSOCKET: {
        SECURE_PROXY: SECURE_WEBSOCKET_URL,
    },
    
    // AI Microservice - USED by WebSocketContext  
    OPENAI_MICROSERVICE: {
        BASE_URL: OPENAI_MICROSERVICE_URL,
        CHAT_COMPLETIONS: `${OPENAI_MICROSERVICE_URL}/api/openai/chat/completions`,
        HEALTH: `${OPENAI_MICROSERVICE_URL}/api/health`,
    },


    // User Management - USED by auth services
    USER: {
        CREATE_USER: `${API_GATEWAY_URL}/users`,
        UPDATE_USER: `${API_GATEWAY_URL}/users/:id`,
        GET_USER_BY_TG_ID: `${API_GATEWAY_URL}/users/Idtelegram/v2/:tg_id`,
        GET_USER_BY_WALLET: `${API_GATEWAY_URL}/users/wallet/:walletAddress`,
        AGGREGATE_WALLETS: `${API_GATEWAY_URL}/users/aggregate/:id`,
        // Profile settings - USED by auth flows
        CHECK_PROFILE_SETTINGS: `${API_GATEWAY_URL}/profile_settings/user/:id`,
        CREATE_PROFILE_SETTINGS: `${API_GATEWAY_URL}/profile_settings`,
    },

    // Social endpoints - USED by explore feature
    SOCIAL: {
        GET_INFLUENCERS: `${API_GATEWAY_URL}/cashtags/influencers`,
        GET_INFLUENCER_BY_ID: `${API_GATEWAY_URL}/influencers_bens_list/:id`,
        UPDATE_INFLUENCER_BY_ID: `${API_GATEWAY_URL}/influencers_bens_list/:id`,
        GET_TOKENS: `${API_GATEWAY_URL}/tokens`,
        GET_MENTIONS: `${API_GATEWAY_URL}/cashtags/mentions`
    }
};

export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
};

// Export OpenAI Microservice configuration
export const OPENAI_MICROSERVICE_CONFIG = {
    URL: OPENAI_MICROSERVICE_URL,
    TOKEN: OPENAI_MICROSERVICE_TOKEN,
    WEBSOCKET_URL: SECURE_WEBSOCKET_URL
};
