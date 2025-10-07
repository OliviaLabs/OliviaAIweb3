# 🔍 TOKEN RESOLUTION GUIDE
**How to call each API with token data - Step by step**

---

## 📊 **PRICE & MARKET DATA APIS**

### 1. CoinGecko APIs
**Process:**
1. Search: `GET /api/v3/search?query=BROCCOLI`
2. Extract best match by rank: `coins[0].id` → `"czs-dog"`
3. Call: `GET /api/coingecko/coins/czs-dog`

**Token Input:** Symbol (e.g., "BROCCOLI", "BTC", "ETH")  
**API Needs:** CoinGecko ID (e.g., "czs-dog", "bitcoin", "ethereum")  
**Resolution:** ALWAYS search first, get ID, then call

**Endpoints affected:**
- `/api/coingecko/coins/:coinId`
- `/api/coingecko/prices?ids=...`
- `/api/coingecko/markets`

---

### 2. CoinStats APIs
**Process:**
1. Try mapping: Check hardcoded symbol-to-ID map (e.g., "BTC" → "bitcoin")
2. If not in map, search: `GET /api/coinstats/search?query=BROCCOLI`
3. Extract: `data[0].coinId` or `data[0].id`
4. Call: `GET /api/coinstats/coins/:coinId`

**Token Input:** Symbol or name  
**API Needs:** CoinStats coin ID (similar to CoinGecko but different)  
**Resolution:** Try map first, fallback to search

**Endpoints affected:**
- `/api/coinstats/coins/:coinId`
- `/api/coinstats/search`

---

### 3. Lurky APIs
**Process:**
- Direct use: `GET /api/lurky/coins?coinSymbol=BROCCOLI`

**Token Input:** Symbol (e.g., "BROCCOLI", "BTC")  
**API Needs:** Symbol directly - NO RESOLUTION NEEDED  
**Resolution:** Pass symbol as-is

**Endpoints affected:**
- `/api/lurky/coins`
- `/api/lurky/trending`

---

## 🔗 **BLOCKCHAIN-SPECIFIC APIS**

### 4. TON APIs
**Process:**
- For jetton info: Need TON contract address
- For popular jettons: No params needed

**Token Input:** TON contract address (e.g., "EQA...")  
**API Needs:** TON-specific address format  
**Resolution:** If user gives symbol, must search external TON explorer or use CoinGecko to get contract

**Endpoints affected:**
- `/api/ton/jetton-info/:address`
- `/api/ton/account/:address`
- `/api/ton/popular-jettons` (no params)

---

### 5. Alchemy / Chainbase APIs
**Process:**
1. Need: Contract address + network
2. If given symbol, use CoinGecko to get platform data:
   - Search: `GET /api/v3/search?query=BROCCOLI` → get ID
   - Get details: `GET /api/v3/coins/:id` → extract `platforms`
   - Example: `"platforms": {"binance-smart-chain": "0x6d5..."}`
3. Map network name:
   - "ethereum" → "eth-mainnet"
   - "binance-smart-chain" → "bsc-mainnet"
   - "polygon" → "polygon-mainnet"
4. Call: `POST /api/alchemy/token-balances` with address + network

**Token Input:** Symbol (e.g., "BROCCOLI")  
**API Needs:** Contract address + network  
**Resolution:** CoinGecko search → get ID → get coin details → extract platforms

**Endpoints affected:**
- `/api/alchemy/token-balances`
- `/api/alchemy/token-metadata`
- `/api/chainbase/account/balance/:chainId/:address`

---

## 🐦 **SOCIAL & SENTIMENT APIS**

### 6. Twitter API
**Process:**
- Direct use: `GET /api/twitter/search?query=$BROCCOLI OR CZ's Dog`

**Token Input:** Symbol or name  
**API Needs:** Query string (symbol with $ or name)  
**Resolution:** Format symbol with $ prefix, or use full name

**Endpoints affected:**
- `/api/twitter/search`

---

### 7. Protokols APIs
**Process:**
- Most endpoints don't need specific tokens
- For KOL search: Use symbol or name directly

**Token Input:** Symbol or name (optional)  
**API Needs:** Query string  
**Resolution:** Pass as-is

**Endpoints affected:**
- `/api/protokols/kol/trending`
- `/api/protokols/posts/search`
- `/api/protokols/projects/trending`

---

## 💱 **SWAP & TRADING APIS**

### 8. 0x API
**Process:**
1. Need: Contract addresses for both tokens
2. If given symbols, use CoinGecko to get contract addresses:
   - Search: `GET /api/v3/search?query=USDT` → get ID
   - Get details: `GET /api/v3/coins/:id` → extract `platforms.ethereum`
3. Call: `GET /api/zerox/quote?sellToken=0x...&buyToken=0x...`

**Token Input:** Symbol (e.g., "USDT", "WETH")  
**API Needs:** Ethereum contract addresses  
**Resolution:** CoinGecko search → get platforms → extract ethereum address

**Endpoints affected:**
- `/api/zerox/quote`

---

### 9. OKX API
**Process:**
- Similar to 0x but uses different chain IDs

**Token Input:** Symbol or contract address  
**API Needs:** Contract address + chainId  
**Resolution:** CoinGecko search → get platforms → map to OKX chain format

**Endpoints affected:**
- `/api/okx/quote`
- `/api/okx/popular-pairs`

---

### 10. ChangeNOW API
**Process:**
- Direct use: `GET /api/changenow/exchange-amount?from=btc&to=eth`

**Token Input:** Symbol (lowercase)  
**API Needs:** Lowercase symbol  
**Resolution:** Convert to lowercase

**Endpoints affected:**
- `/api/changenow/exchange-amount`

---

## 🎯 **RESOLUTION PRIORITY**

### When given a token symbol/name:

1. **First attempt:** CoinGecko Search
   - Most reliable
   - Returns ID, rank, and all platform data
   - Use for: CoinGecko, CoinStats, Alchemy, Chainbase, 0x, OKX

2. **Direct use:**
   - Lurky (uses symbols directly)
   - Twitter (uses symbols/names)
   - ChangeNOW (lowercase symbols)

3. **Special handling:**
   - TON (needs TON-specific addresses)
   - Portfolio (needs user wallet address, not token)

---

## 🚀 **IMPLEMENTATION IN TOKEN RESOLVER AGENT**

The Token Resolver Agent should:

1. **Identify API type** from endpoint
2. **Choose resolution strategy:**
   - CoinGecko-based → search + get details
   - Direct symbol → format and pass
   - Contract needed → get from CoinGecko platforms
3. **Cache results** to avoid repeated searches
4. **Handle failures** gracefully (return null if can't resolve)

**Current implementation handles:**
- ✅ CoinGecko coin ID resolution
- ❌ Contract address extraction (NEEDS TO BE ADDED)
- ❌ Network mapping (NEEDS TO BE ADDED)
- ❌ Symbol formatting (NEEDS TO BE ADDED)
