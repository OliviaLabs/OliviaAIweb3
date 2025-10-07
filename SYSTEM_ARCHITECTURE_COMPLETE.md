# 🏗️ OLIVIA AI WEB3 - COMPLETE SYSTEM ARCHITECTURE

**Last Updated:** October 7, 2025  
**Purpose:** Comprehensive technical documentation of the entire system

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Startup Procedures](#startup-procedures)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Microservice Architecture](#backend-microservice-architecture)
6. [Multi-Agent AI System](#multi-agent-ai-system)
7. [Plugin System](#plugin-system)
8. [Data Flow](#data-flow)
9. [API Endpoints](#api-endpoints)
10. [Configuration & Environment](#configuration--environment)
11. [Testing & Debugging](#testing--debugging)

---

## 🎯 SYSTEM OVERVIEW

Olivia AI is a **Web3-native AI assistant** that combines:
- **Real-time cryptocurrency data** from 10+ APIs
- **Multi-agent AI reasoning** for intelligent responses
- **Context-aware plugins** that feed data to the AI
- **Seamless Web3 wallet integration** (Ethereum, Solana, TON, ICP)
- **Natural conversational interface** with Telegram integration

### Key Technologies
- **Frontend:** React 18.3.1 + Vite + TailwindCSS + HeroUI
- **Backend:** Node.js + Express + WebSocket
- **AI:** OpenAI GPT-4 with custom multi-agent orchestration
- **Web3:** Wagmi + WalletConnect + Internet Identity
- **APIs:** 10+ crypto data sources (CoinGecko, TON Center, Twitter, etc.)

---

## 🏛️ ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Browser/Telegram)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                         │
│                        Port: 3001                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  CONTEXTS (Global State Management)                        │ │
│  │  • AuthContext - User authentication                       │ │
│  │  • WebSocketContext - AI communication                     │ │
│  │  • ChatContext - Conversation history                      │ │
│  │  • InternetIdentityContext - ICP integration               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PAGES                                                     │ │
│  │  • Home - Main chat + 16 plugin bubbles                   │ │
│  │  • Login - Web3 wallet connection                         │ │
│  │  • Plugins - Enable/disable data sources                  │ │
│  │  • Explore - Discover tokens                              │ │
│  │  • Profile - User settings                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  PLUGIN SYSTEM (Context Awareness)                         │ │
│  │  16 plugins auto-trigger on user intent:                  │ │
│  │  1. CoinGecko      9. Lurky                               │ │
│  │  2. Twitter        10. Protokols                           │ │
│  │  3. CoinStats      11. Alchemy Portfolio                  │ │
│  │  4. TON Center     12. Chainbase                           │ │
│  │  5. 0x Protocol    13. OKX DEX                             │ │
│  │  6. ChangeNOW      14. WebSearch                           │ │
│  │  7. Hedera         15. ICP                                 │ │
│  │  8. TonConnect     16. Proactive AI                        │ │
│  │                                                            │ │
│  │  Each plugin:                                              │ │
│  │  • Detects intent from user message                       │ │
│  │  • Fetches data from microservice API                     │ │
│  │  • Creates visual "bubble" with data                      │ │
│  │  • Syncs data to window.contextAwarenessData              │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP POST to /api/openai/multi-agent
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND MICROSERVICE (Node.js/Express)              │
│                        Port: 3000                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MIDDLEWARE (Express)                                      │ │
│  │  • CORS - Security for localhost:3001                     │ │
│  │  • Rate Limiting - 50K req/min (dev mode)                 │ │
│  │  • authenticateAdmin - JWT or dev-token                   │ │
│  │  • validateOrigin - Whitelist allowed origins             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ROUTES (/api/...)                                         │ │
│  │  • /openai - Multi-agent chat, token info                 │ │
│  │  • /ton - TON blockchain data                             │ │
│  │  • /twitter - Social sentiment                            │ │
│  │  • /coinstats - Market data                               │ │
│  │  • /lurky - Token trending                                │ │
│  │  • /protokols - KOL insights                              │ │
│  │  • /alchemy - Portfolio data                              │ │
│  │  • /zerox - Swap quotes                                   │ │
│  │  • /okx - DEX aggregation                                 │ │
│  │  • /changenow - Cross-chain swaps                         │ │
│  │  • /chainbase - Multi-chain analytics                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MULTI-AGENT AI SYSTEM ⭐ CORE INTELLIGENCE               │ │
│  │                                                            │ │
│  │  User Question: "what's trending on TON?"                 │ │
│  │           │                                                │ │
│  │           ▼                                                │ │
│  │  ┌──────────────────────────────────────────────┐        │ │
│  │  │ AGENT 1: REASONING AGENT                     │        │ │
│  │  │ - Understands user intent dynamically        │        │ │
│  │  │ - Identifies data requirements               │        │ │
│  │  │ - Extracts entities (tokens, chains, etc.)   │        │ │
│  │  │ - Determines urgency                         │        │ │
│  │  │                                              │        │ │
│  │  │ OUTPUT:                                      │        │ │
│  │  │ {                                            │        │ │
│  │  │   "user_wants": "User wants to see trending │        │ │
│  │  │                  tokens on TON blockchain",  │        │ │
│  │  │   "to_answer_need": ["trending",            │        │ │
│  │  │                       "price",               │        │ │
│  │  │                       "sentiment"],          │        │ │
│  │  │   "entities_mentioned": {                    │        │ │
│  │  │     "blockchains": ["TON"]                   │        │ │
│  │  │   },                                         │        │ │
│  │  │   "urgency": "medium"                        │        │ │
│  │  │ }                                            │        │ │
│  │  └──────────────────┬───────────────────────────┘        │ │
│  │                     │                                     │ │
│  │                     ▼                                     │ │
│  │  ┌──────────────────────────────────────────────┐        │ │
│  │  │ AGENT 2: API CONTROL AGENT                   │        │ │
│  │  │ - Selects relevant APIs based on intent      │        │ │
│  │  │ - Calls APIs in parallel                     │        │ │
│  │  │ - Aggregates raw data                        │        │ │
│  │  │                                              │        │ │
│  │  │ SELECTED APIs:                               │        │ │
│  │  │ • /api/ton/popular-jettons                   │        │ │
│  │  │ • /api/twitter/search (query: "TON")         │        │ │
│  │  │ • /api/lurky/trending                        │        │ │
│  │  │                                              │        │ │
│  │  │ FETCHES REAL DATA from controllers           │        │ │
│  │  └──────────────────┬───────────────────────────┘        │ │
│  │                     │                                     │ │
│  │                     ▼                                     │ │
│  │  ┌──────────────────────────────────────────────┐        │ │
│  │  │ REASONING AGENT (Filter Step)                │        │ │
│  │  │ - Filters data based on relevance            │        │ │
│  │  │ - Removes noise/irrelevant info              │        │ │
│  │  │ - Keeps only what answers user's Q           │        │ │
│  │  └──────────────────┬───────────────────────────┘        │ │
│  │                     │                                     │ │
│  │                     ▼                                     │ │
│  │  ┌──────────────────────────────────────────────┐        │ │
│  │  │ AGENT 3: FRONTEND AGENT                      │        │ │
│  │  │ - Formats response naturally                 │        │ │
│  │  │ - Uses conversational tone                   │        │ │
│  │  │ - Includes specific data points              │        │ │
│  │  │ - Asks follow-up questions                   │        │ │
│  │  │                                              │        │ │
│  │  │ FINAL RESPONSE:                              │        │ │
│  │  │ "Based on TON Center, the top trending       │        │ │
│  │  │  tokens are USDT (86M TVL), NOT, and jUSDT.  │        │ │
│  │  │  Twitter shows 50+ mentions in the last      │        │ │
│  │  │  hour. Want me to pull up detailed charts?"  │        │ │
│  │  └──────────────────────────────────────────────┘        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  SERVICES (Business Logic)                                 │ │
│  │  • OpenAI - GPT-4 API wrapper                             │ │
│  │  • TON Center - Blockchain queries                        │ │
│  │  • Twitter - Social search via RapidAPI                   │ │
│  │  • CoinStats - Market data                                │ │
│  │  • WebSocket Proxy - Secure WS tunnel                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ External API Calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIs (3rd Party)                     │
│  • OpenAI GPT-4 API                                             │
│  • TON Center API                                               │
│  • Twitter/X API (RapidAPI)                                     │
│  • CoinGecko API                                                │
│  • CoinStats API                                                │
│  • 0x Protocol API                                              │
│  • OKX DEX API                                                  │
│  • Alchemy API                                                  │
│  • ChangeNOW API                                                │
│  • Lurky API                                                    │
│  • Protokols API                                                │
│  • Chainbase API                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 STARTUP PROCEDURES

### Prerequisites
1. **Node.js** v18+ installed
2. **npm** v8+ installed
3. **.env file** with API keys (see Configuration section)

### Quick Start (Development)

#### Option 1: Start Both Frontend + Backend (RECOMMENDED)

```bash
# From project root
cd /Users/bencuervo/Desktop/OliviaAIweb3

# Kill any processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Terminal 1: Start Backend Microservice
cd microservice
npm install
npm start
# ✅ Backend runs on http://localhost:3000

# Terminal 2: Start Frontend
cd ..
npm install
npm run dev
# ✅ Frontend runs on http://localhost:3001
```

#### Option 2: Using Package Scripts

```bash
# Start backend
npm run start:microservice

# Start frontend (in separate terminal)
npm run dev
```

### Verify Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Expected: `{"status":"healthy","timestamp":"..."}`

2. **Frontend:**
   - Open: `http://localhost:3001`
   - Should see: Login page with Web3 wallet options

3. **Hard Refresh Browser:**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

---

## 🎨 FRONTEND ARCHITECTURE

### Entry Point Flow

```
index.html
  └─> main.jsx
       └─> App.jsx (Routes)
            └─> Layout.jsx (Sidebar + Content)
                 └─> Home.jsx (Main chat interface)
```

### Context Providers (Global State)

1. **ErrorBoundary** - Catches React errors
2. **HeroUIProvider** - UI component library
3. **AppKitProvider** - Web3Modal for wallet connections
4. **BrowserRouter** - React Router
5. **AuthProviderLogin** - User authentication state
6. **InternetIdentityProvider** - ICP authentication
7. **WebSocketProvider** ⭐ - AI communication & message handling
8. **ChatProvider** - Conversation history
9. **App** - Main routes and page logic

### Key Files

#### `/src/main.jsx`
- Initializes React app
- Wraps everything in provider hierarchy
- Sets up global error handlers
- Disables Telegram analytics in dev mode

#### `/src/App.jsx`
- Defines routes:
  - `/` → Home (chat interface)
  - `/login` → Login page
  - `/plugins` → Plugin management
  - `/explore` → Token discovery
  - `/profile` → User settings
- Telegram WebApp detection
- Route guards (PrivateRoute, PublicRoute)

#### `/src/contexts/WebSocketContext.jsx` ⭐ CRITICAL
- **Purpose:** Handles ALL communication with backend AI
- **Method:** HTTP POST to `/api/openai/multi-agent` (NOT WebSocket!)
- **Key Functions:**
  - `sendMessage(message)` - Sends user question to multi-agent system
  - `subscribe(handler)` - Listens for AI responses
  - `getTradeQuote()` - Token swap quotes
  - `executeTradeSwap()` - Execute swaps
  - `checkTokenBalance()` - Portfolio balance checks

**Important:** Despite the name "WebSocketContext", it currently uses HTTP POST requests for AI chat, not WebSocket connections. The WebSocket functionality is reserved for the external agent proxy.

#### `/src/pages/Home.jsx` ⭐ CORE UI
- **Lines of code:** 4,825 (yes, it's massive)
- **Purpose:** Main chat interface + all 16 plugin bubbles
- **Key Responsibilities:**
  1. **User Intent Detection** (lines 1795-1870)
     - Analyzes user message for keywords
     - Determines which plugins to trigger
  2. **Plugin Orchestration** (lines 1873-3700)
     - Triggers plugins based on intent
     - Fetches data from microservice
     - Creates visual bubbles
  3. **Context Awareness** (lines 321-369)
     - Syncs plugin data to `window.contextAwarenessData`
     - Updates AI context in real-time
  4. **AI Message Handling** (lines 1183-1298)
     - Receives streamed AI responses
     - Parses for token mentions
     - Updates UI with formatted messages
  5. **Proactive AI** (lines 3821-3945)
     - Auto-suggests trending tokens
     - Pre-triggers plugins before user asks

### Plugin System Architecture

**Location:** `/src/pages/Home.jsx` (lines 1873-3700)

Each plugin follows this pattern:

```javascript
// 1. Intent Detection
const wantsPrice = message.match(/\b(price|cost|value)\b/i);

// 2. Enable Check
if (wantsPrice && isPluginEnabled('coingecko')) {
  
  // 3. Create Bubble (Visual UI)
  const newBubble = {
    id: Date.now() + Math.random(),
    title: 'CoinGecko Price',
    content: 'Loading...',
    loading: true
  };
  setCoinGeckoBubbles(prev => [...prev, newBubble]);
  
  // 4. Fetch Data from Microservice
  const response = await fetch('http://localhost:3000/api/coingecko/price');
  const data = await response.json();
  
  // 5. Update Context for AI
  window.contextAwarenessData = {
    ...window.contextAwarenessData,
    coingecko_price_data: {
      token: 'BTC',
      price: data.price,
      timestamp: new Date().toISOString(),
      source: 'CoinGecko API'
    }
  };
  
  // 6. Update Bubble with Real Data
  setCoinGeckoBubbles(prev => prev.map(bubble => 
    bubble.id === newBubble.id 
      ? { ...bubble, content: `$${data.price}`, loading: false }
      : bubble
  ));
}
```

**16 Plugins:**
1. **CoinGecko** - Price, market cap, volume, trending
2. **Twitter** - Social sentiment, mentions, engagement
3. **CoinStats** - Alternative market data
4. **TON Center** - TON blockchain data, jettons
5. **0x Protocol** - Token swap quotes (Ethereum)
6. **ChangeNOW** - Cross-chain exchange rates
7. **Hedera** - HBAR blockchain data
8. **TonConnect** - TON wallet integration
9. **Lurky** - Token discovery, trending
10. **Protokols** - KOL insights, narratives
11. **Alchemy** - Portfolio balances (multi-chain)
12. **Chainbase** - Cross-chain analytics
13. **OKX DEX** - DEX aggregation quotes
14. **WebSearch** - Real-time news (via backend)
15. **ICP** - Internet Computer integration
16. **Proactive AI** - Auto-suggests trending tokens

**Plugin State Management:**

```javascript
// Enable/disable plugins
const [pluginsEnabled, setPluginsEnabled] = useState({
  coingecko: true,
  twitter: true,
  coinstats: false, // DISABLED by default
  ton: true,
  // ... etc
});

const isPluginEnabled = (pluginId) => pluginsEnabled[pluginId];
```

**Context Awareness Global Object:**

```javascript
// Accessible from anywhere in the app
window.contextAwarenessData = {
  active_token: { symbol: 'BTC', name: 'Bitcoin', id: 'bitcoin' },
  market_data: { btc: { price: 65000, change_24h: 2.5 } },
  sentiment_data: { twitter_mentions: 1500 },
  portfolio_data: { wallet_address: '0x...', total_tokens: 9 },
  ton_center_data: { popular_jettons: [...] },
  coingecko_price_data: { ... },
  twitter_data: { tweets: [...] },
  // ... all plugin data syncs here
  last_updated: "2025-10-07T09:16:46.746Z"
};
```

---

## ⚙️ BACKEND MICROSERVICE ARCHITECTURE

### Entry Point

`/microservice/src/server.js` - Main server file

### Server Initialization Flow

```javascript
// 1. Load environment variables
import { config } from './config/config.js';

// 2. Create Express app
const app = express();

// 3. Apply middleware
app.use(cors({ origin: config.allowedOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Apply rate limiting
app.use('/api/openai/', openaiRateLimit);
app.use('/api/coinstats/', coinStatsRateLimit);
// ... etc

// 5. Mount routes
app.use('/api', routes);

// 6. Create HTTP server
const server = createServer(app);

// 7. Create WebSocket server (for external agent proxy)
const wss = new WebSocketServer({ server, path: '/ws/secure-proxy' });

// 8. Start listening
server.listen(3000, () => {
  console.log('🚀 OpenAI Microservice running on port 3000');
});
```

### Middleware Stack

#### 1. CORS (`/microservice/src/server.js`)
```javascript
app.use(cors({
  origin: config.allowedOrigin, // http://localhost:3001 in dev
  credentials: true
}));
```

#### 2. Rate Limiting (`/microservice/src/middleware/rateLimiting.js`)
```javascript
export const openaiRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  max: 50000, // 50K requests (dev mode - no real limit)
  message: 'Too many requests, please try again later.'
});
```

#### 3. Authentication (`/microservice/src/middleware/auth.js`)
```javascript
export const authenticateAdmin = (req, res, next) => {
  // In development: skip auth
  if (config.nodeEnv === 'development') {
    return next();
  }
  
  // Check for Bearer token
  const token = req.headers.authorization?.slice(7);
  
  // Allow dev-token
  if (token === 'dev-token' || token === config.adminAccessSecret) {
    return next();
  }
  
  // Verify JWT
  try {
    const decoded = jwt.verify(token, config.adminAccessSecret);
    req.tokenInfo = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};
```

#### 4. Origin Validation (`/microservice/src/middleware/validateOrigin.js`)
```javascript
export const validateOrigin = (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [
    config.allowedOrigin,
    'http://localhost:3001',
    'https://oliviaaiweb3-1.onrender.com'
  ];
  
  if (config.nodeEnv === 'development' || allowedOrigins.some(allowed => origin?.includes(allowed))) {
    return next();
  }
  
  res.status(403).json({ error: 'Origin not allowed' });
};
```

### Route Structure

`/microservice/src/routes/index.js` - Main router

```javascript
import openaiRoutes from './openaiRoutes.js';
import tonCenterRoutes from './tonCenterRoutes.js';
import twitterRoutes from './twitterRoutes.js';
// ... etc

const router = express.Router();

// Mount sub-routers
router.use('/openai', openaiRoutes);
router.use('/ton', tonCenterRoutes);
router.use('/twitter', twitterRoutes);
// ... etc

export default router;
```

### Controllers (Business Logic)

Each controller handles a specific domain:

#### OpenAI Controller (`/microservice/src/controllers/openaiController.js`)

**Key Methods:**
- `generateChatCompletion(req, res)` - Legacy single-agent chat
- `multiAgentChat(req, res)` ⭐ **NEW** - 3-agent pipeline
- `extractTradingIntent(req, res)` - Parse swap requests
- `getModels(req, res)` - List available AI models
- `getTokenInfo(req, res)` - Token metadata lookup
- `healthCheck(req, res)` - Server health status

**Multi-Agent Chat Flow:**
```javascript
static async multiAgentChat(req, res) {
  const { messages, address } = req.body;
  const userMessage = messages[messages.length - 1].content;
  
  // Define API fetcher (calls real controllers)
  const apiFetcher = async (endpoint, params) => {
    // Import controllers dynamically
    const { tonCenterController } = await import('./tonCenterController.js');
    const { twitterController } = await import('./twitterController.js');
    // ... etc
    
    // Map endpoints to controller methods
    const routeMap = {
      '/api/ton/popular-jettons': () => tonCenterController.getPopularJettons(...),
      '/api/twitter/search': () => twitterController.search(...),
      // ... etc
    };
    
    // Execute and return real data
    return await routeMap[endpoint]();
  };
  
  // Run multi-agent pipeline
  const result = await AgentOrchestrator.process(
    userMessage,
    { address },
    conversationHistory,
    apiFetcher
  );
  
  // Return OpenAI-compatible response
  res.json({
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion',
    choices: [{
      message: {
        role: 'assistant',
        content: result.response
      }
    }],
    metadata: result.metadata
  });
}
```

#### TON Center Controller (`/microservice/src/controllers/tonCenterController.js`)
- `getAccount(req, res)` - TON wallet info
- `getJettonInfo(req, res)` - Jetton metadata
- `getPopularJettons(req, res)` - Trending TON tokens
- `getPrice(req, res)` - TON price
- `getBalance(req, res)` - TON wallet balance

#### Twitter Controller (`/microservice/src/controllers/twitterController.js`)
- `search(req, res)` - Search tweets by query
- Uses RapidAPI Twitter API

#### ... and 8 more controllers for each data source

---

## 🤖 MULTI-AGENT AI SYSTEM ⭐

**Location:** `/microservice/src/agents/`

**Purpose:** Intelligent, dynamic AI responses that understand context and call the right APIs

### Architecture

```
User Question
      ↓
┌─────────────────────┐
│ REASONING AGENT     │ ← Understands intent
│ reasoningAgent.js   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ API CONTROL AGENT   │ ← Selects & calls APIs
│ apiControlAgent.js  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ REASONING AGENT     │ ← Filters data
│ (Filter Step)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ FRONTEND AGENT      │ ← Formats response
│ frontendAgent.js    │
└──────────┬──────────┘
           │
           ▼
    Final Response
```

### Agent 1: Reasoning Agent

**File:** `/microservice/src/agents/reasoningAgent.js`

**Purpose:** Deeply understands what the user wants

**Key Method:** `analyzeIntent(userMessage, conversationHistory)`

**Example:**

**Input:**
```javascript
userMessage: "what's trending on TON"
conversationHistory: [
  { role: 'user', content: 'hi' },
  { role: 'assistant', content: 'Hello! How can I help?' }
]
```

**Process:**
```javascript
// Sends to OpenAI GPT-4:
const prompt = `You are an intelligent reasoning agent.

YOUR JOB:
1. Understand the user's question in natural language
2. Identify what information would answer their question
3. Determine which types of data are needed

AVAILABLE DATA TYPES:
- price: Current token prices
- volume: Trading volume
- marketCap: Market capitalization
- trending: What's popular/moving
- news: Recent news/announcements
- sentiment: Community opinions/social data
- portfolio: User's wallet/holdings
- swapQuote: Token exchange rates
- blockchainData: On-chain metrics
- kols: Influencer/KOL opinions

User asked: "what's trending on TON"

RESPOND WITH JSON:
{
  "user_wants": "<What does the user actually want?>",
  "to_answer_need": ["<data types needed>"],
  "entities_mentioned": {
    "tokens": ["<tokens mentioned>"],
    "blockchains": ["<chains mentioned>"]
  },
  "urgency": "<high/medium/low>",
  "reasoning": "<Why you chose these data types>"
}`;

const aiResponse = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.3
});
```

**Output:**
```json
{
  "user_wants": "User wants to see what tokens are currently popular and gaining traction on the TON blockchain",
  "to_answer_need": ["trending", "volume", "sentiment"],
  "entities_mentioned": {
    "tokens": [],
    "blockchains": ["TON"],
    "other": []
  },
  "urgency": "medium",
  "reasoning": "User is asking about what's popular (trending), so we need trending token data. Volume and sentiment help show why tokens are trending."
}
```

### Agent 2: API Control Agent

**File:** `/microservice/src/agents/apiControlAgent.js`

**Purpose:** Selects which APIs to call and executes them

**Key Methods:**
- `selectAPIs(understanding, userContext)` - Choose relevant APIs
- `executeAPIs(apiCalls, apiFetcher)` - Call APIs in parallel

**Example:**

**Input:**
```javascript
understanding: {
  "user_wants": "...",
  "to_answer_need": ["trending", "volume", "sentiment"],
  "entities_mentioned": { "blockchains": ["TON"] }
}
```

**Process:**
```javascript
// Maps data needs to API endpoints
selectAPIs(understanding, userContext) {
  const apiCalls = [];
  const needs = understanding.to_answer_need;
  const entities = understanding.entities_mentioned;
  
  // If needs trending + TON mentioned → call TON API
  if (needs.includes('trending') && entities.blockchains?.includes('TON')) {
    apiCalls.push({
      endpoint: '/api/ton/popular-jettons',
      params: {},
      reason: 'Get trending TON tokens'
    });
  }
  
  // If needs sentiment → call Twitter
  if (needs.includes('sentiment')) {
    apiCalls.push({
      endpoint: '/api/twitter/search',
      params: { query: 'TON crypto' },
      reason: 'Get Twitter sentiment'
    });
  }
  
  return apiCalls;
}
```

**Output:**
```javascript
[
  {
    endpoint: '/api/ton/popular-jettons',
    params: {},
    reason: 'Get trending TON tokens'
  },
  {
    endpoint: '/api/twitter/search',
    params: { query: 'TON crypto' },
    reason: 'Get Twitter sentiment'
  }
]
```

**Execution:**
```javascript
async executeAPIs(apiCalls, apiFetcher) {
  const results = await Promise.all(
    apiCalls.map(async (call) => {
      const data = await apiFetcher(call.endpoint, call.params);
      return { [call.endpoint]: data };
    })
  );
  
  return Object.assign({}, ...results);
}
```

**apiFetcher Implementation:**

The `apiFetcher` function in `openaiController.js` calls **real controller methods**:

```javascript
const apiFetcher = async (endpoint, params) => {
  const { tonCenterController } = await import('./tonCenterController.js');
  const { twitterController } = await import('./twitterController.js');
  
  const routeMap = {
    '/api/ton/popular-jettons': () => {
      return new Promise((resolve) => {
        const mockReq = { query: {} };
        const mockRes = {
          json: (data) => resolve(data)
        };
        tonCenterController.getPopularJettons(mockReq, mockRes);
      });
    },
    '/api/twitter/search': () => {
      return new Promise((resolve) => {
        const mockReq = { query: { query: params.query } };
        const mockRes = {
          json: (data) => resolve(data)
        };
        twitterController.search(mockReq, mockRes);
      });
    }
  };
  
  return await routeMap[endpoint]();
};
```

**Result:**
```json
{
  "/api/ton/popular-jettons": {
    "success": true,
    "jettons": [
      { "name": "USDT", "symbol": "USDT", "tvl": "86000000" },
      { "name": "NOT", "symbol": "NOT", "tvl": "45000000" }
    ]
  },
  "/api/twitter/search": {
    "success": true,
    "tweets": [
      { "text": "TON is pumping!", "likes": 150 }
    ]
  }
}
```

### Reasoning Agent (Filter Step)

**Purpose:** Remove irrelevant data

**Method:** `filterData(rawData, understanding)`

**Example:**

**Input:**
```javascript
rawData: {
  "/api/ton/popular-jettons": { jettons: [...] },
  "/api/twitter/search": { tweets: [...100 tweets...] }
}
understanding: { to_answer_need: ["trending", "sentiment"] }
```

**Process:**
```javascript
filterData(rawData, understanding) {
  const filtered = {};
  const needs = understanding.to_answer_need;
  
  // Only keep data types that were requested
  for (const [key, value] of Object.entries(rawData)) {
    if (key.includes('trending') && needs.includes('trending')) {
      filtered[key] = value;
    }
    if (key.includes('twitter') && needs.includes('sentiment')) {
      // Only keep top 10 tweets
      filtered[key] = { ...value, tweets: value.tweets.slice(0, 10) };
    }
  }
  
  return { filtered, reasoning: 'Kept only trending and sentiment data' };
}
```

### Agent 3: Frontend Agent

**File:** `/microservice/src/agents/frontendAgent.js`

**Purpose:** Format response naturally for the user

**Key Method:** `formatResponse(userMessage, filteredData, understanding, conversationHistory)`

**Example:**

**Input:**
```javascript
userMessage: "what's trending on TON"
filteredData: {
  "/api/ton/popular-jettons": {
    jettons: [
      { name: "USDT", tvl: "86000000" },
      { name: "NOT", tvl: "45000000" }
    ]
  },
  "/api/twitter/search": {
    tweets: [{ text: "TON is pumping!", likes: 150 }]
  }
}
understanding: { user_wants: "..." }
```

**Process:**
```javascript
// Sends to OpenAI GPT-4:
const prompt = `You are a friendly crypto AI assistant.

WHAT THE USER WANTED:
"${understanding.user_wants}"

DATA YOU HAVE:
${JSON.stringify(filteredData, null, 2)}

YOUR JOB:
- Answer the user naturally and conversationally
- Use specific data points from the data provided
- Be concise but informative
- Ask a follow-up question to keep the conversation going

User asked: "${userMessage}"

Respond naturally:`;

const aiResponse = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are Olivia, a friendly crypto AI assistant.' },
    { role: 'user', content: prompt }
  ],
  temperature: 0.7
});
```

**Output:**
```
"Based on TON Center data, the top trending tokens right now are:

1. **USDT** - Leading with $86M in TVL
2. **NOT** - Second place with $45M TVL

Twitter sentiment is positive too, with users mentioning TON's momentum. Want me to pull up detailed charts for any of these?"
```

### Orchestrator

**File:** `/microservice/src/agents/orchestrator.js`

**Purpose:** Coordinates the entire 4-step pipeline

**Key Method:** `process(userMessage, userContext, conversationHistory, apiFetcher)`

**Full Flow:**
```javascript
static async process(userMessage, userContext, conversationHistory, apiFetcher) {
  console.log('🎯 MULTI-AGENT PIPELINE STARTED');
  
  // STEP 1: Understand intent
  const understanding = await ReasoningAgent.analyzeIntent(
    userMessage,
    conversationHistory
  );
  console.log('✅ Intent:', understanding.user_wants);
  
  // STEP 2: Select and call APIs
  const apiCalls = APIControlAgent.selectAPIs(understanding, userContext);
  console.log('✅ Calling APIs:', apiCalls.map(c => c.endpoint));
  
  const rawData = await APIControlAgent.executeAPIs(apiCalls, apiFetcher);
  console.log('✅ Got data from', Object.keys(rawData).length, 'APIs');
  
  // STEP 3: Filter data
  const filteredData = ReasoningAgent.filterData(rawData, understanding);
  console.log('✅ Filtered to relevant data');
  
  // STEP 4: Format response
  const response = await FrontendAgent.formatResponse(
    userMessage,
    filteredData,
    understanding,
    conversationHistory
  );
  console.log('✅ Formatted response');
  
  return {
    success: true,
    response,
    metadata: {
      understanding: understanding.user_wants,
      apiCallsMade: apiCalls.length,
      dataUsed: Object.keys(filteredData.filtered)
    }
  };
}
```

---

## 🔌 PLUGIN SYSTEM

**Location:** Frontend `/src/pages/Home.jsx`

### Plugin Architecture

Each plugin is a **self-contained module** that:
1. Detects when it should activate (intent detection)
2. Checks if it's enabled
3. Creates a visual bubble
4. Fetches data from microservice
5. Syncs data to global context (`window.contextAwarenessData`)
6. Updates bubble with results

### Example Plugin: TON Center

```javascript
// PLUGIN: TON Center
// Lines 1873-1950 in Home.jsx

const handleSendMessage = async (message) => {
  // 1. INTENT DETECTION
  const mentionsTON = message.match(/\b(TON|ton center|jetton|toncoin)\b/i);
  
  // 2. ENABLE CHECK
  if (mentionsTON && isPluginEnabled('ton')) {
    
    // 3. CREATE BUBBLE
    const newBubble = {
      id: Date.now() + Math.random(),
      title: '🔷 TON Center',
      content: 'Fetching TON blockchain data...',
      loading: true
    };
    setTonBubbles(prev => [...prev, newBubble]);
    
    // 4. FETCH DATA
    try {
      const response = await fetch('http://localhost:3000/api/ton/popular-jettons');
      const data = await response.json();
      
      // 5. SYNC TO GLOBAL CONTEXT
      const tonContext = {
        ton_center_data: {
          popular_jettons: data.jettons,
          timestamp: new Date().toISOString(),
          source: 'TON Center API'
        }
      };
      
      window.contextAwarenessData = {
        ...window.contextAwarenessData,
        ...tonContext
      };
      
      // 6. UPDATE BUBBLE
      setTonBubbles(prev => prev.map(bubble => 
        bubble.id === newBubble.id 
          ? { 
              ...bubble, 
              content: `Top jettons: ${data.jettons.slice(0, 3).map(j => j.name).join(', ')}`,
              loading: false 
            }
          : bubble
      ));
      
      console.log('🧠 Updated AI context with TON data:', tonContext);
      
    } catch (error) {
      console.error('TON plugin error:', error);
      setTonBubbles(prev => prev.map(bubble => 
        bubble.id === newBubble.id 
          ? { ...bubble, content: 'Failed to load', loading: false }
          : bubble
      ));
    }
  }
};
```

### Plugin Enable/Disable

**Page:** `/src/pages/Plugins.jsx`

**Storage:** `localStorage.getItem('olivia_enabled_plugins')`

**Default State:**
```javascript
const defaultPlugins = {
  coingecko: true,
  twitter: true,
  coinstats: false, // Disabled by default
  ton: true,
  zerox: true,
  changenow: true,
  hedera: true,
  tonconnect: true,
  lurky: true,
  protokols: true,
  alchemy: true,
  chainbase: true,
  okx: true,
  websearch: true,
  icp: true,
  proactive: true
};
```

**Toggle Function:**
```javascript
const togglePlugin = (pluginId) => {
  const newState = { ...pluginsEnabled, [pluginId]: !pluginsEnabled[pluginId] };
  setPluginsEnabled(newState);
  localStorage.setItem('olivia_enabled_plugins', JSON.stringify(newState));
};
```

### Context Awareness Flow

```
User asks: "what's the price of BTC?"
         ↓
Intent Detection: wantsPrice = true
         ↓
Plugin Check: isPluginEnabled('coingecko') = true
         ↓
CoinGecko Plugin Activates
         ↓
Fetch: http://localhost:3000/api/coingecko/price?id=bitcoin
         ↓
Response: { id: 'bitcoin', price: 65000, ... }
         ↓
Sync to Global Context:
window.contextAwarenessData.coingecko_price_data = {
  token: 'bitcoin',
  price: 65000,
  timestamp: '2025-10-07T10:00:00.000Z',
  source: 'CoinGecko API'
}
         ↓
Create Bubble: "BTC: $65,000"
         ↓
AI sees context when answering:
"Bitcoin is currently trading at $65,000..."
```

---

## 📊 DATA FLOW

### Complete Request/Response Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER TYPES: "what's trending on TON?"                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND (Home.jsx)                                           │
│    • Intent detection: mentionsTON = true                        │
│    • Trigger TON plugin (if enabled)                             │
│    • Fetch: http://localhost:3000/api/ton/popular-jettons       │
│    • Create bubble: "🔷 TON Center - Loading..."                │
│    • Sync data to window.contextAwarenessData                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. FRONTEND (WebSocketContext.jsx)                              │
│    • sendMessage() called                                        │
│    • Prepare payload:                                            │
│      {                                                           │
│        messages: [                                               │
│          { role: 'system', content: 'You are Olivia AI...' },   │
│          { role: 'user', content: 'what\'s trending on TON?' }  │
│        ],                                                        │
│        address: '0x...'                                          │
│      }                                                           │
│    • POST to http://localhost:3000/api/openai/multi-agent       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. BACKEND (server.js)                                           │
│    • Receive POST request                                        │
│    • Apply middleware:                                           │
│      - CORS check ✓                                              │
│      - Rate limit check ✓                                        │
│      - Auth check ✓ (dev mode = skip)                           │
│      - Origin validation ✓                                       │
│    • Route to: /api/openai/multi-agent                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. BACKEND (openaiRoutes.js)                                    │
│    • Match route: POST /multi-agent                              │
│    • Call: OpenAIController.multiAgentChat(req, res)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. BACKEND (openaiController.js)                                │
│    • Extract: messages, address from req.body                   │
│    • Create apiFetcher function (calls real controllers)        │
│    • Call: AgentOrchestrator.process(...)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. MULTI-AGENT PIPELINE (orchestrator.js)                       │
│                                                                  │
│    STEP 1: ReasoningAgent.analyzeIntent()                       │
│    • Calls OpenAI GPT-4                                          │
│    • Returns: { user_wants: "...", to_answer_need: [...] }      │
│                                                                  │
│    STEP 2: APIControlAgent.selectAPIs()                         │
│    • Returns: [                                                  │
│        { endpoint: '/api/ton/popular-jettons' },                │
│        { endpoint: '/api/twitter/search', params: {query:'TON'} }│
│      ]                                                           │
│                                                                  │
│    STEP 3: APIControlAgent.executeAPIs()                        │
│    • Calls apiFetcher for each endpoint                         │
│    • apiFetcher calls real controller methods:                  │
│      - tonCenterController.getPopularJettons()                  │
│      - twitterController.search()                               │
│    • Returns: { "/api/ton/...": {...}, "/api/twitter/...": {...} }│
│                                                                  │
│    STEP 4: ReasoningAgent.filterData()                          │
│    • Filters to only relevant data                              │
│                                                                  │
│    STEP 5: FrontendAgent.formatResponse()                       │
│    • Calls OpenAI GPT-4                                          │
│    • Returns natural language response                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. BACKEND (openaiController.js)                                │
│    • Receives final response from orchestrator                  │
│    • Format as OpenAI-compatible JSON:                          │
│      {                                                           │
│        id: 'chatcmpl-123456',                                    │
│        object: 'chat.completion',                                │
│        choices: [{                                               │
│          message: {                                              │
│            role: 'assistant',                                    │
│            content: 'Based on TON Center data, the top...'       │
│          }                                                       │
│        }],                                                       │
│        metadata: { apiCallsMade: 2, ... }                        │
│      }                                                           │
│    • res.json(response)                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. FRONTEND (WebSocketContext.jsx)                              │
│    • Receive JSON response                                       │
│    • Extract: choices[0].message.content                         │
│    • Emit 'stream_complete' event with response                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. FRONTEND (Home.jsx)                                          │
│    • subscribe(handleMessage) receives event                    │
│    • data.type === 'stream_complete'                            │
│    • Extract: data.data.fullResponse                            │
│    • Add to messages array                                      │
│    • Update UI with AI bubble                                   │
│    • Parse response for token mentions                          │
│    • Show input field again                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. USER SEES RESPONSE                                           │
│    "Based on TON Center data, the top trending tokens are:      │
│     1. USDT - $86M TVL                                           │
│     2. NOT - $45M TVL                                            │
│     Twitter sentiment is positive. Want details?"                │
└─────────────────────────────────────────────────────────────────┘
```

### Timing (Typical)

- **Plugin data fetch:** 200-500ms
- **Multi-agent pipeline:** 2-5 seconds
  - Step 1 (Intent): 800ms
  - Step 2 (APIs): 1-2 seconds (parallel)
  - Step 3 (Filter): 100ms
  - Step 4 (Format): 1-2 seconds
- **Total response time:** 3-6 seconds

---

## 🌐 API ENDPOINTS

### Backend Microservice (Port 3000)

#### Health & Status
```
GET /api/health
Response: { status: "healthy", timestamp: "..." }
```

#### OpenAI / Multi-Agent
```
POST /api/openai/multi-agent
Headers:
  Authorization: Bearer dev-token
  Content-Type: application/json
Body:
  {
    "messages": [
      { "role": "system", "content": "You are Olivia..." },
      { "role": "user", "content": "what's trending on TON?" }
    ],
    "address": "0x..." (optional)
  }
Response:
  {
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "choices": [{
      "message": {
        "role": "assistant",
        "content": "Based on TON Center data..."
      }
    }],
    "metadata": {
      "understanding": "...",
      "apiCallsMade": 2,
      "dataUsed": [...]
    }
  }
```

#### TON Center
```
GET /api/ton/popular-jettons
GET /api/ton/account/:address
GET /api/ton/jetton/:address
GET /api/ton/price
GET /api/ton/balance?address=...
```

#### Twitter
```
GET /api/twitter/search?query=BTC&type=Latest
```

#### CoinStats
```
GET /api/coinstats/search?query=bitcoin
GET /api/coinstats/coins/:coinId
```

#### Lurky
```
GET /api/lurky/trending
GET /api/lurky/coins?limit=50
```

#### Protokols
```
GET /api/protokols/kol/trending
GET /api/protokols/narratives
```

#### Alchemy (Portfolio)
```
POST /api/portfolio/:address
Body: { network: "eth-mainnet" }
```

#### 0x Protocol (Swaps)
```
GET /api/zerox/quote?sellToken=ETH&buyToken=USDC&sellAmount=1000000000000000000
POST /api/zerox/swap
```

#### OKX DEX
```
GET /api/okx/popular-pairs
GET /api/okx/quote?fromToken=ETH&toToken=USDC&amount=1
POST /api/okx/swap
```

#### ChangeNOW
```
GET /api/changenow/currencies
GET /api/changenow/exchange-amount?from=btc&to=eth&amount=1
```

#### Chainbase
```
GET /api/chainbase/latest-block?chain=ethereum
GET /api/chainbase/token-price?address=0x...&chain=ethereum
```

---

## ⚙️ CONFIGURATION & ENVIRONMENT

### Environment Variables

**Location:** `/microservice/.env` or root `/.env`

**Required Variables:**

```bash
# Server Config
PORT=3000
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:3001

# Authentication
ADMIN_ACCESS_SECRET=your-secret-key-here

# OpenAI
OPENAI_API_KEY=sk-...

# Crypto APIs
TON_CENTER_API_KEY=...
ZERO_EX_API_KEY=...
COINSTATS_API_KEY=...
LURKY_API_KEY=...
OKX_API_KEY=...
OKX_SECRET_KEY=...
OKX_PASSPHRASE=...
CHANGENOW_API_KEY=...
OLIVIA_LABS_API_KEY=...
NOWPAYMENTS_API_KEY=...

# Twitter (RapidAPI)
RAPIDAPI_KEY=...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=50000

# WebSocket Proxy (External Agent Service)
WEBSOCKET_PATH=/ws/secure-proxy
EXTERNAL_WEBSOCKET_URLS=wss://web2-agents-ai-micro-service-nodejs-8851907900.europe-west1.run.app/ws/agent/stream
```

### Frontend Environment Variables

**Location:** `/.env`

```bash
# OpenAI Microservice URL
VITE_OPENAI_MICROSERVICE_URL=http://localhost:3000

# Web3Modal
VITE_PROJECT_ID=...

# ICP Canister IDs
VITE_ICP_BACKEND_CANISTER_ID=...
VITE_INTERNET_IDENTITY_CANISTER_ID=...

# Telegram
VITE_TELEGRAM_BOT_TOKEN=...
```

### Configuration Files

#### Backend Config
**File:** `/microservice/src/config/config.js`

```javascript
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  adminAccessSecret: process.env.ADMIN_ACCESS_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  tonCenterApiKey: process.env.TON_CENTER_API_KEY,
  zeroXApiKey: process.env.ZERO_EX_API_KEY,
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:3001',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50000,
  websocketPath: process.env.WEBSOCKET_PATH || '/ws/secure-proxy',
  externalWebsocketUrls: process.env.EXTERNAL_WEBSOCKET_URLS?.split(',') || [...]
};
```

#### Frontend Config
**File:** `/src/api/config/endpoints.js`

```javascript
export const OPENAI_MICROSERVICE_URL = 
  import.meta.env.VITE_OPENAI_MICROSERVICE_URL || 
  (window.location.hostname === 'oliviaaiweb3-1.onrender.com' 
    ? 'https://oliviaaiweb3-1.onrender.com' 
    : 'http://localhost:3000');
```

---

## 🧪 TESTING & DEBUGGING

### Manual Testing Checklist

#### 1. **Backend Health Check**
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"healthy","timestamp":"..."}
```

#### 2. **Test Multi-Agent Endpoint**
```bash
curl -X POST http://localhost:3000/api/openai/multi-agent \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "what is trending on TON?"}
    ],
    "address": "0x1234567890abcdef"
  }'
```

Expected response: OpenAI-style JSON with assistant message

#### 3. **Test TON API**
```bash
curl http://localhost:3000/api/ton/popular-jettons \
  -H "Authorization: Bearer dev-token"
```

Expected: JSON with jettons array

#### 4. **Test Twitter API**
```bash
curl "http://localhost:3000/api/twitter/search?query=BTC" \
  -H "Authorization: Bearer dev-token"
```

Expected: JSON with tweets array

#### 5. **Frontend Console Checks**

Open browser console (F12) and look for:

```
✅ Good signs:
🚀 Main.jsx starting...
📱 App component rendering...
🟦 WebSocketProvider mounting...
🧠 Synced context data to window: {...}
📊 [CoinGecko] Using trending data
🔷 [TON Center] Fetching data...

❌ Bad signs:
❌ Failed to connect to http://localhost:3000
🚨 Global error caught: TypeError...
⚠️ CORS error
⚠️ Network error
```

### Debugging Tips

#### Problem: AI responds with "undefined"

**Cause:** Multi-agent pipeline not returning proper response

**Fix:**
1. Check backend logs for agent errors
2. Verify OpenAI API key is set
3. Check `/microservice/src/controllers/openaiController.js` line 746
4. Ensure `result.response` exists

#### Problem: "[object Object]" in chat

**Cause:** Trying to display object instead of string

**Fix:**
1. Check `/src/pages/Home.jsx` lines 1196-1206
2. Verify `data.data.fullResponse` is a string
3. Add `console.log('✅ Final response:', finalResponse)` to debug

#### Problem: "WebSocket not connected"

**Cause:** Frontend still trying to use WebSocket (old behavior)

**Fix:**
1. Verify `/src/contexts/WebSocketContext.jsx` line 356
2. Should be HTTP POST, not WebSocket send
3. Hard refresh browser: `Cmd + Shift + R`

#### Problem: Plugin not triggering

**Cause:** Plugin disabled or intent not detected

**Fix:**
1. Check `/src/pages/Plugins.jsx` - is plugin enabled?
2. Check `/src/pages/Home.jsx` intent detection regex
3. Add `console.log('🎯 User Intent:', userIntent)` to debug

#### Problem: CORS error

**Cause:** Backend not allowing frontend origin

**Fix:**
1. Check `/microservice/src/config/config.js`
2. Verify `allowedOrigin: 'http://localhost:3001'`
3. Check `.env` file: `ALLOWED_ORIGIN=http://localhost:3001`

#### Problem: Port already in use

**Fix:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Logging Best Practices

**Backend:**
```javascript
console.log('🤖 [Multi-Agent] Processing request...');
console.log('✅ [Multi-Agent] Got data from', Object.keys(rawData).length, 'APIs');
console.error('❌ [Multi-Agent] Error:', error);
```

**Frontend:**
```javascript
console.log('🧠 Synced context data to window:', data);
console.log('📨 Home.jsx received message:', data);
console.error('❌ Plugin error:', error);
```

---

## 🎓 KEY LEARNINGS FOR FUTURE SESSIONS

### Critical Architecture Points

1. **Frontend DOES NOT use WebSocket for AI chat**
   - Uses HTTP POST to `/api/openai/multi-agent`
   - WebSocket only for external agent proxy (deprecated)

2. **Multi-Agent System runs on LOCAL microservice**
   - NOT on Google Cloud external service
   - All 3 agents (Reasoning, API Control, Frontend) in `/microservice/src/agents/`

3. **Plugins are Frontend-Side Context Feeders**
   - Located in `/src/pages/Home.jsx`
   - Sync data to `window.contextAwarenessData`
   - AI doesn't directly call plugins - it receives their data as context

4. **API Fetcher MUST call real controllers**
   - No mock data allowed
   - Uses dynamic imports to call controller methods
   - Returns real API responses

5. **Context Awareness is the Key**
   - `window.contextAwarenessData` is the source of truth
   - Updated by plugins in real-time
   - Accessed by AI when formatting responses

### Common Pitfalls to Avoid

1. **Don't confuse WebSocket proxy with AI chat**
   - Proxy is for external agent service (optional)
   - AI chat is HTTP POST

2. **Don't put business logic in routes**
   - Routes should only call controllers
   - Controllers handle business logic

3. **Don't modify package.json port configs**
   - Backend MUST be 3000
   - Frontend MUST be 3001

4. **Don't skip environment variables**
   - System won't work without API keys
   - Check `.env` file first when debugging

5. **Don't assume plugins auto-work**
   - Check if enabled in `/src/pages/Plugins.jsx`
   - Verify intent detection regex matches user message

---

## 📚 FILE REFERENCE

### Critical Files (MUST READ)

1. `/microservice/src/server.js` - Backend entry point
2. `/microservice/src/agents/orchestrator.js` - Multi-agent coordinator
3. `/microservice/src/controllers/openaiController.js` - AI request handler
4. `/src/contexts/WebSocketContext.jsx` - Frontend AI communication
5. `/src/pages/Home.jsx` - Main UI + all plugins
6. `/microservice/src/config/config.js` - Environment config

### Secondary Files (Reference as Needed)

- `/microservice/src/agents/reasoningAgent.js`
- `/microservice/src/agents/apiControlAgent.js`
- `/microservice/src/agents/frontendAgent.js`
- `/microservice/src/routes/index.js`
- `/microservice/src/middleware/auth.js`
- `/src/api/config/endpoints.js`

---

## ✅ QUICK START CHECKLIST

- [ ] Clone repository
- [ ] Create `.env` files (root + microservice)
- [ ] Add all API keys to `.env`
- [ ] Install dependencies: `npm install` (root + microservice)
- [ ] Start backend: `cd microservice && npm start`
- [ ] Start frontend: `npm run dev`
- [ ] Verify backend: `curl http://localhost:3000/api/health`
- [ ] Open browser: `http://localhost:3001`
- [ ] Hard refresh: `Cmd + Shift + R`
- [ ] Connect Web3 wallet
- [ ] Enable plugins in `/plugins` page
- [ ] Test AI: "what's trending on TON?"
- [ ] Check console for errors
- [ ] Verify AI response is natural (not "undefined" or "[object Object]")

---

## 🚨 EMERGENCY TROUBLESHOOTING

### System Not Working At All

```bash
# 1. Kill everything
pkill -9 node
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# 2. Fresh install
cd /Users/bencuervo/Desktop/OliviaAIweb3
rm -rf node_modules package-lock.json
cd microservice
rm -rf node_modules package-lock.json
cd ..

# 3. Reinstall
npm install
cd microservice
npm install
cd ..

# 4. Start clean
cd microservice
npm start
# Wait 5 seconds
cd ..
npm run dev

# 5. Hard refresh browser
# Cmd + Shift + R (Mac)
# Ctrl + Shift + R (Windows)
```

### AI Responding with Garbage

```bash
# Check backend logs
cd microservice
npm start
# Look for errors in multi-agent pipeline
```

### Plugins Not Working

1. Go to: `http://localhost:3001/plugins`
2. Enable all plugins
3. Hard refresh: `Cmd + Shift + R`
4. Check browser console for plugin errors

---

**END OF DOCUMENTATION**

This document should be the SINGLE SOURCE OF TRUTH for understanding the Olivia AI Web3 system. Update it whenever the architecture changes.
