# 🔍 COMPLETE TOKEN RESOLUTION FOR ALL 73 APIs

**Comprehensive guide on how to resolve and call each API with token data**

---

## 📊 ALCHEMY APIs (2 endpoints)

### 1. POST `/api/alchemy/token-balances`
**Parameters:**
- `address`: Wallet address (required)
- `network`: Network name (required) - e.g., "eth-mainnet", "polygon-mainnet", "arb-mainnet"

**Token Resolution:**
- If given wallet address → pass as-is
- Network is NOT token-specific, it's blockchain-specific

**No token resolution needed**

---

### 2. POST `/api/alchemy/token-metadata`
**Parameters:**
- `contractAddress`: Token contract address (required)
- `network`: Network name (required)

**Token Resolution (if given symbol):**
1. Search CoinGecko: `GET /api/v3/search?query=BROCCOLI`
2. Get coin details: `GET /api/v3/coins/czs-dog`
3. Extract platforms: `platforms["binance-smart-chain"]` → `"0x6d5..."`
4. Map network: "binance-smart-chain" → "bsc-mainnet"
5. Call: `{contractAddress: "0x6d5...", network: "bsc-mainnet"}`

---

## ⛓️ CHAINBASE APIs (9 endpoints)

### 3-8. Blockchain Data APIs
- `/latest-block`, `/transactions`, `/token-price`, `/nfts`, `/defi`, `/cross-chain`

**No token resolution needed** - these are general blockchain queries

---

### 9. GET `/api/chainbase/chains`
**No parameters**
**No token resolution needed**

---

### 10. GET `/api/chainbase/stats/:chainId`
**Parameters:**
- `chainId`: Chain identifier (in URL)

**No token resolution needed** - chain-level stats

---

### 11. GET `/api/chainbase/account/balance/:chainId/:address`
**Parameters:**
- `chainId`: Chain identifier (in URL)
- `address`: Wallet address (in URL)

**No token resolution needed** - wallet balance query

---

## 💱 CHANGENOW APIs (6 endpoints)

### 12. GET `/api/changenow/currencies`
**No parameters**
**No token resolution needed** - lists all currencies

---

### 13. GET `/api/changenow/exchange-amount`
**Parameters:**
- `from`: Currency symbol (required) - lowercase
- `to`: Currency symbol (required) - lowercase
- `amount`: Amount to exchange (required)

**Token Resolution:**
- Convert symbols to lowercase: "BROCCOLI" → "broccoli"
- Pass directly: `{from: "broccoli", to: "btc", amount: "1"}`

---

### 14-17. Other ChangeNOW APIs
- `/min-amount`, `/exchange-rate`, `/transactions`

**Same token resolution:** Lowercase symbols

---

## 📈 COINSTATS APIs (5 endpoints)

### 18. GET `/api/coinstats/coins`
**Parameters:**
- `limit`, `page`, `currency` (optional)

**No token resolution needed** - returns top coins

---

### 19. GET `/api/coinstats/coins/:coinId`
**Parameters:**
- `coinId`: CoinStats coin ID (in URL)

**Token Resolution (if given symbol):**
1. Check hardcoded map: "BTC" → "bitcoin", "ETH" → "ethereum"
2. If not in map, search: `GET /api/coinstats/search?query=BROCCOLI`
3. Extract: `data[0].coinId`
4. Call: `/api/coinstats/coins/broccoli`

---

### 20. GET `/api/coinstats/markets`
**Parameters:**
- `limit`, `currency`, `sortBy` (optional)

**No token resolution needed** - market overview

---

### 21. GET `/api/coinstats/search`
**Parameters:**
- `query`: Symbol or name (required)

**Token Resolution:**
- Pass symbol/name directly: `{query: "BROCCOLI"}`

---

### 22. GET `/api/coinstats/portfolio-insights`
**No specific token parameters**
**No token resolution needed**

---

## 🦎 COINGECKO APIs (5 endpoints)

### 23. GET `/api/coingecko/trending`
**No parameters**
**No token resolution needed** - returns trending coins

---

### 24. GET `/api/coingecko/prices`
**Parameters:**
- `ids`: Comma-separated CoinGecko IDs (required)

**Token Resolution (if given symbol):**
1. Search: `GET /api/v3/search?query=BROCCOLI`
2. Get best match by rank: `coins[0].id` → "czs-dog"
3. Call: `{ids: "czs-dog"}`

---

### 25. GET `/api/coingecko/coins/:coinId`
**Parameters:**
- `coinId`: CoinGecko ID (in URL)

**Token Resolution (if given symbol):**
- Same as #24: Search → get ID → call

---

### 26. GET `/api/coingecko/markets`
**Parameters:**
- `vs_currency`, `order`, `per_page`, `page`, `category` (optional)

**Token Resolution:**
- If `category` param used with blockchain name:
  - "TON" → "ton-ecosystem"
  - "Solana" → "solana-ecosystem"
  - Dynamic: `${blockchain.toLowerCase()}-ecosystem`

---

### 27. GET `/api/coingecko/search`
**Parameters:**
- `query`: Search term (required)

**Token Resolution:**
- Pass symbol/name directly: `{query: "BROCCOLI"}`

---

## 🎨 EXPLORE APIs (5 endpoints)

### 28-32. Explore APIs
- `/bubble-data`, `/token-speakers/:symbol`, `/tracked-influencers`, `/submit-influencer`, `/user-submissions/:user_id`

**Token Resolution for `/token-speakers/:symbol`:**
- Pass symbol directly in URL: `/api/explore/token-speakers/BROCCOLI`

**Others:** No token resolution needed

---

## 🔍 LURKY APIs (4 endpoints)

### 33. GET `/api/lurky/coins`
**Parameters:**
- `coinSymbol`: Token symbol (optional)
- `sort_by`, `sentiment`, `limit`, etc. (optional)

**Token Resolution:**
- Pass symbol directly: `{coinSymbol: "BROCCOLI"}`
- NO ID lookup needed!

---

### 34. GET `/api/lurky/trending`
**Parameters:**
- `limit` (optional)

**No token resolution needed**

---

### 35-36. `/api/lurky/generic/*`
**Generic proxy endpoints**
**Token resolution depends on target Lurky endpoint**

---

## 🔗 OKX APIs (9 endpoints)

### 37. GET `/api/okx/chains`
**No parameters**
**No token resolution needed**

---

### 38. GET `/api/okx/quote`
**Parameters:**
- `chainId`: Network ID (required) - e.g., "1" for Ethereum
- `fromTokenAddress`: Contract address (required)
- `toTokenAddress`: Contract address (required)
- `amount`: Amount in smallest unit (required)

**Token Resolution (if given symbols):**
1. For each token, search CoinGecko: `GET /api/v3/search?query=USDT`
2. Get coin details: `GET /api/v3/coins/:id`
3. Extract contract for specific chain: `platforms.ethereum` → "0xdac..."
4. Map chainId: "ethereum" → "1", "polygon" → "137", etc.
5. Call: `{chainId: "1", fromTokenAddress: "0xdac...", toTokenAddress: "0xa0b...", amount: "1000000"}`

---

### 39-45. Other OKX APIs
- `/swap`, `/tokens`, `/token-holders`, `/popular-pairs`, `/olivia-quote`, `/olivia-labs`

**Same resolution process:** Symbol → CoinGecko → Contract Address + ChainId

---

## 🤖 OPENAI APIs (6 endpoints)

### 46-50. OpenAI Internal APIs
- `/chat/completions`, `/multi-agent`, `/extract-trading`, `/models`, `/token-info`

**No token resolution needed** - these are AI/system endpoints

---

### 51. GET `/api/openai/websearch`
**Parameters:**
- `query`: Search query (required)

**Token Resolution:**
- Format query naturally: "What blockchain is BROCCOLI on?"
- NO ID lookup needed

---

## 📱 PROTOKOLS APIs (7 endpoints)

### 52-58. Protokols APIs
- `/status`, `/kol/trending`, `/narratives`, `/profile/:username`, `/projects/trending`, `/posts/search`, `/analysis`

**Token Resolution for `/posts/search`:**
- `query`: Pass symbol or name directly

**Others:** No token resolution needed - social/KOL data

---

## 🔵 TON CENTER APIs (10 endpoints)

### 59-67. TON APIs
- `/account/:address`, `/balance/:address`, `/transactions/:address`, `/jettons/:address`, `/jetton-info/:address`, `/masterchain`, `/popular-jettons`, `/price`, `/run-method`

**Token Resolution:**
- For jetton-info: Needs TON contract address (EQA...)
- If given symbol, must use external TON explorer or CoinGecko platforms data
- Most endpoints need TON-specific addresses, not symbols

**No generic symbol resolution** - TON ecosystem is separate

---

## 🐦 TWITTER API (1 endpoint)

### 68. POST `/api/twitter/search`
**Parameters:**
- `query`: Search query (required)

**Token Resolution:**
- Format with $: "BROCCOLI" → "$BROCCOLI"
- Or use full name: "CZ's Dog"
- Pass: `{query: "$BROCCOLI OR CZ's Dog"}`

---

## 🔄 0X PROTOCOL APIs (5 endpoints)

### 69. GET `/api/zerox/quote`
**Parameters:**
- `sellToken`: Token address or symbol (required)
- `buyToken`: Token address or symbol (required)
- `sellAmount` OR `buyAmount`: Amount (required)

**Token Resolution (if given symbols):**
1. Search CoinGecko for both tokens
2. Get coin details for each
3. Extract Ethereum addresses: `platforms.ethereum`
4. Call: `{sellToken: "0xdac...", buyToken: "0xa0b...", sellAmount: "1000000"}`

---

### 70-73. Other 0x APIs
- `/price`, `/tokens`, `/gas-price`, `/orderbook`

**Same resolution:** Symbol → CoinGecko → Ethereum Contract Address

---

## 🎯 SUMMARY: TOKEN RESOLUTION STRATEGIES

### Strategy 1: CoinGecko ID Resolution (15 APIs)
**Used by:** CoinGecko, CoinStats (partial)
**Process:**
1. Search CoinGecko: `GET /search?query={symbol}`
2. Pick best match by rank: `coins[0].id`
3. Use ID in API call

**APIs:** `/coingecko/coins/:id`, `/coingecko/prices`, `/coinstats/coins/:coinId`

---

### Strategy 2: Contract Address Extraction (20+ APIs)
**Used by:** Alchemy, OKX, 0x, Chainbase
**Process:**
1. Search CoinGecko: `GET /search?query={symbol}`
2. Get coin details: `GET /coins/{id}`
3. Extract contract: `platforms.{blockchain}`
4. Map network names
5. Use contract + network in API call

**APIs:** `/alchemy/token-metadata`, `/okx/quote`, `/zerox/quote`, etc.

---

### Strategy 3: Direct Symbol (10 APIs)
**Used by:** Lurky, ChangeNOW, Twitter, Explore
**Process:**
1. Format symbol (lowercase for ChangeNOW, $ prefix for Twitter)
2. Pass directly to API

**APIs:** `/lurky/coins`, `/changenow/exchange-amount`, `/twitter/search`

---

### Strategy 4: No Resolution Needed (28 APIs)
**Used by:** General queries, lists, stats
**Examples:** `/coingecko/trending`, `/okx/chains`, `/protokols/narratives`

---

## 🔧 IMPLEMENTATION PRIORITY

### Phase 1: Core APIs (IMPLEMENT FIRST)
1. ✅ CoinGecko ID resolution (Strategy 1)
2. ❌ Contract address extraction (Strategy 2) - **CRITICAL**
3. ✅ Direct symbol formatting (Strategy 3)

### Phase 2: Network Mapping
- Ethereum formats: "ethereum", "eth-mainnet", "1"
- Map between different API network naming conventions

### Phase 3: Caching
- Cache CoinGecko search results
- Cache contract addresses
- TTL: 1 hour for token data
