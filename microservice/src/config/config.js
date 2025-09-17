import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from microservice directory
const envPath = path.resolve(process.cwd(), '.env');
const microserviceEnvPath = path.resolve(__dirname, '..', '..', '.env');
const rootEnvPath = path.resolve(__dirname, '..', '..', '..', '.env');

console.log('🔧 Looking for .env files:');
console.log('  - Current dir:', envPath);
console.log('  - Microservice dir:', microserviceEnvPath);
console.log('  - Root dir:', rootEnvPath);

// Try to load .env from multiple locations
if (existsSync(envPath)) {
  console.log('✅ Loading .env from current directory');
  dotenv.config({ path: envPath });
} else if (existsSync(microserviceEnvPath)) {
  console.log('✅ Loading .env from microservice directory');
  dotenv.config({ path: microserviceEnvPath });
} else if (existsSync(rootEnvPath)) {
  console.log('✅ Loading .env from root directory');
  dotenv.config({ path: rootEnvPath });
} else {
  console.log('⚠️ No .env file found, using environment variables');
}

// Debug: Check if key environment variables are loaded
console.log('🔍 Environment variables loaded:');
console.log('  - PORT:', process.env.PORT);
console.log('  - ZERO_EX_API_KEY:', process.env.ZERO_EX_API_KEY ? 'SET' : 'MISSING');
console.log('  - TON_CENTER_API_KEY:', process.env.TON_CENTER_API_KEY ? 'SET' : 'MISSING');
console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'MISSING');

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  adminAccessSecret: process.env.ADMIN_ACCESS_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  changeNowApiKey: process.env.CHANGENOW_API_KEY,
  coinStatsApiKey: process.env.COINSTATS_API_KEY,
  lurkyApiKey: process.env.LURKY_API_KEY,
  lurkyApiBaseUrl: process.env.LURKY_API_BASE_URL || 'https://api.lurky.app',
  okxApiKey: process.env.OKX_API_KEY,
  okxSecretKey: process.env.OKX_SECRET_KEY,
  okxPassphrase: process.env.OKX_PASSPHRASE,
  okxDexBaseUrl: process.env.OKX_DEX_BASE_URL || 'https://www.okx.com/api/v5/dex/aggregator',
  tonCenterApiKey: process.env.TON_CENTER_API_KEY,
  zeroXApiKey: process.env.ZERO_EX_API_KEY,
  coinStatsApiKey: process.env.COINSTATS_API_KEY,
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:3001',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50000, // Very high for dev - no real limits
  
  // WebSocket Proxy Configuration
  websocketPath: process.env.WEBSOCKET_PATH || '/ws/secure-proxy',
  externalWebsocketUrls: process.env.EXTERNAL_WEBSOCKET_URLS ? 
    process.env.EXTERNAL_WEBSOCKET_URLS.split(',') : [
      'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app/ws/agent/stream',
      'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app/ws',
      'wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app',
      'ws://localhost:8080/ws/agent/stream'
    ]
};

// Validate required environment variables
if (!config.adminAccessSecret) {
  console.warn('⚠️  ADMIN_ACCESS_SECRET is not set. Using default for development.');
}

if (!config.openaiApiKey) {
  console.warn('Warning: OPENAI_API_KEY is not set. You will need to set this to use OpenAI features.');
}

if (!config.changeNowApiKey) {
  console.warn('Warning: CHANGENOW_API_KEY is not set. You will need to set this to use ChangeNOW features.');
}

if (!config.coinStatsApiKey) {
  console.warn('Warning: COINSTATS_API_KEY is not set. You will need to set this to use CoinStats features.');
}

if (!config.zeroXApiKey) {
  console.warn('Warning: ZERO_EX_API_KEY is not set. You will need to set this to use 0x Protocol features.');
}

if (!config.lurkyApiKey) {
  console.warn('Warning: LURKY_API_KEY is not set. You will need to set this to use Lurky features.');
}

if (!config.okxApiKey) {
  console.warn('Warning: OKX_API_KEY is not set. You will need to set this to use OKX DEX features.');
}

if (!config.okxSecretKey) {
  console.warn('Warning: OKX_SECRET_KEY is not set. You will need to set this to use OKX DEX features.');
}

if (!config.okxPassphrase) {
  console.warn('Warning: OKX_PASSPHRASE is not set. You will need to set this to use OKX DEX features.');
}

// WebSocket Proxy validation
if (!process.env.EXTERNAL_WEBSOCKET_URLS && config.externalWebsocketUrls.length > 0) {
  console.log('✅ Using default external WebSocket endpoints:');
  config.externalWebsocketUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });
} else if (process.env.EXTERNAL_WEBSOCKET_URLS) {
  console.log('✅ Using custom external WebSocket endpoints from environment:');
  config.externalWebsocketUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });
} else if (config.externalWebsocketUrls.length === 0) {
  console.error('🚨 ERROR: No external WebSocket endpoints configured!');
  console.error('   Please set EXTERNAL_WEBSOCKET_URLS environment variable or check config.');
}
