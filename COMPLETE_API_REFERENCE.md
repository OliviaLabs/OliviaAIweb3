# 🎯 COMPLETE API REFERENCE FOR MULTI-AGENT SYSTEM

**All available APIs that the Reasoning Agent can generate queries for**

---

## 📊 **PRICE & MARKET DATA APIS**

### 1. **CoinStats - Search Coins**
**Endpoint:** `/api/coinstats/search`
**Parameters:**
```json
{
  "query": "BNB"  // Coin name or symbol (required)
}
```
**Use for:** Getting specific coin data (price, marketcap, volume)
**Example queries:** "BNB", "ethereum", "bitcoin"

### 2. **CoinStats - Get Coins List**
**Endpoint:** `/api/coinstats/coins`
**Parameters:**
```json
{
  "limit": 10,        // Number of coins (optional)
  "page": 1,          // Page number (optional)
  "currency": "USD"   // Currency (optional)
}
```
**Use for:** Getting top coins by marketcap

### 3. **CoinStats - Get Specific Coin**
**Endpoint:** `/api/coinstats/coins/:coinId`
**Parameters:**
```json
{
  "coinId": "binancecoin"  // CoinStats ID (required)
}
```
**Use for:** Detailed data for one specific coin

### 4. **Lurky - Search Coins**
**Endpoint:** `/api/lurky/coins`
**Parameters:**
```json
{
  "coinSymbol": "BNB",      // Symbol to search (optional)
  "sort_by": "mentions",    // Sort by: mentions, sentiment (optional)
  "sentiment": "bullish",   // bullish, bearish, neutral (optional)
  "limit": 10              // Number of results (optional)
}
```
**Use for:** Sentiment-based coin data

### 5. **Lurky - Trending**
**Endpoint:** `/api/lurky/trending`
**Parameters:** None (uses default trending parameters)
**Use for:** Currently trending coins by mentions

---

## 🔗 **BLOCKCHAIN-SPECIFIC APIS**

### 6. **TON Center - Popular Jettons**
**Endpoint:** `/api/ton/popular-jettons`
**Parameters:** None
**Use for:** Most popular tokens on TON blockchain

### 7. **TON Center - Account Balance**
**Endpoint:** `/api/ton/account/:address`
**Parameters:**
```json
{
  "address": "EQ..."  // TON wallet address (required in URL)
}
```
**Use for:** Getting TON wallet balance and info

### 8. **TON Center - Price**
**Endpoint:** `/api/ton/price`
**Parameters:** None
**Use for:** Current TON token price

### 9. **TON Center - Jetton Info**
**Endpoint:** `/api/ton/jetton-info/:address`
**Parameters:**
```json
{
  "address": "EQ..."  // Jetton contract address (required in URL)
}
```
**Use for:** Info about specific TON jetton

---

## 🐦 **SOCIAL & SENTIMENT APIS**

### 10. **Twitter Search**
**Endpoint:** `/api/twitter/search`
**Parameters:**
```json
{
  "query": "$BNB pumping",     // Search query (required)
  "search_type": "Top"         // Top or Latest (optional)
}
```
**Use for:** Social sentiment, news, trending topics
**Example queries:** "$BNB bullish", "Ethereum news", "crypto crash"

### 11. **Protokols - Trending KOLs**
**Endpoint:** `/api/protokols/kol/trending`
**Parameters:**
```json
{
  "limit": 10,              // Number of KOLs (optional)
  "metric": "views",        // views, engagement (optional)
  "timeframe": "7d"         // 24h, 7d, 30d (optional)
}
```
**Use for:** Finding influential crypto traders/analysts

### 12. **Protokols - Narratives**
**Endpoint:** `/api/protokols/narratives`
**Parameters:**
```json
{
  "limit": 10,              // Number of narratives (optional)
  "timeframe": "7d",        // 24h, 7d, 30d (optional)
  "category": "defi"        // Category filter (optional)
}
```
**Use for:** Current crypto market narratives

### 13. **Protokols - Trending Projects**
**Endpoint:** `/api/protokols/projects/trending`
**Parameters:**
```json
{
  "limit": 10,              // Number of projects (optional)
  "timeframe": "7d"         // 24h, 7d, 30d (optional)
}
```
**Use for:** Hot crypto projects

### 14. **Protokols - Search Posts**
**Endpoint:** `/api/protokols/posts/search`
**Parameters:**
```json
{
  "query": "BNB",           // Search term (required)
  "limit": 20              // Number of posts (optional)
}
```
**Use for:** Finding posts about specific topics

---

## 🔍 **GENERAL SEARCH APIS**

### 15. **Web Search (OpenAI)**
**Endpoint:** `/api/websearch`
**Parameters:**
```json
{
  "query": "BNB Smart Chain trending tokens"  // Search query (required)
}
```
**Use for:** General web search for crypto news/info
**Example queries:** "Ethereum gas fees", "Solana ecosystem updates"

---

## 💱 **TRADING & SWAP APIS**

### 16. **0x Protocol - Get Quote**
**Endpoint:** `/api/zerox/quote`
**Parameters:**
```json
{
  "sellToken": "ETH",       // Token to sell (required)
  "buyToken": "USDC",       // Token to buy (required)
  "sellAmount": "1000000",  // Amount in wei (optional)
  "buyAmount": "1000000",   // Amount in wei (optional)
  "taker": "0x..."          // Wallet address (optional)
}
```
**Use for:** Getting swap quotes

### 17. **OKX - Get Quote**
**Endpoint:** `/api/okx/quote`
**Parameters:**
```json
{
  "fromToken": "ETH",       // Source token (required)
  "toToken": "USDC",        // Destination token (required)
  "amount": "1",            // Amount to swap (required)
  "chain": "eth"            // Blockchain (required)
}
```
**Use for:** DEX swap quotes

### 18. **OKX - Popular Pairs**
**Endpoint:** `/api/okx/popular-pairs`
**Parameters:** None
**Use for:** Most traded token pairs

### 19. **ChangeNOW - Exchange Amount**
**Endpoint:** `/api/changenow/exchange-amount`
**Parameters:**
```json
{
  "from": "btc",            // From currency (required)
  "to": "eth",              // To currency (required)
  "amount": "1"             // Amount (required)
}
```
**Use for:** Cross-chain exchange estimates

---

## 👛 **PORTFOLIO APIS**

### 20. **Portfolio Balance**
**Endpoint:** `/api/portfolio/:address`
**Parameters:**
```json
{
  "address": "0x..."  // Wallet address (required in URL)
}
```
**Use for:** Getting user's token holdings

### 21. **Alchemy - Token Balances**
**Endpoint:** `/api/alchemy/token-balances`
**Parameters:**
```json
{
  "address": "0x...",       // Wallet address (required)
  "chain": "ethereum"       // Chain name (optional)
}
```
**Use for:** Detailed ERC-20 token balances

---

## 🎯 **COMPLETE API MAPPING FOR REASONING AGENT**

### **What Reasoning Agent Should Output:**

```json
{
  "user_wants": "User wants to know what tokens are pumping on BNB",
  "api_queries": {
    "coinstats_search": {
      "query": "BNB"
    },
    "twitter_search": {
      "query": "$BNB pumping OR BSC trending",
      "search_type": "Top"
    },
    "websearch": {
      "query": "BNB Smart Chain top gainers today"
    },
    "lurky_coins": {
      "coinSymbol": "BNB",
      "sort_by": "mentions",
      "sentiment": "bullish"
    }
  },
  "use_cached_data": ["market_data"],
  "entities": {
    "tokens": ["BNB"],
    "blockchains": ["BNB", "BSC"]
  }
}
```

---

## 📋 **QUICK REFERENCE BY USE CASE**

| User Asks | APIs to Call |
|-----------|--------------|
| "Price of X" | `coinstats_search`, `coinstats_coins/:id` |
| "What's trending" | `lurky_trending`, `protokols_trending`, `twitter_search` |
| "News about X" | `websearch`, `twitter_search`, `protokols_posts` |
| "Sentiment on X" | `twitter_search`, `lurky_coins`, `protokols_narratives` |
| "Tokens on TON" | `ton_popular_jettons` |
| "KOLs talking about X" | `protokols_kol_trending`, `twitter_search` |
| "Swap X for Y" | `zerox_quote`, `okx_quote` |
| "My portfolio" | `portfolio/:address`, `alchemy_balances` |
| "Trending projects" | `protokols_trending`, `lurky_trending` |

---

## ⚠️ **CRITICAL RULES FOR REASONING AGENT**

1. **CoinStats search** = specific coin names only ("BNB", "ethereum")
2. **Twitter search** = any freeform text ("$BNB pumping", "crypto news")
3. **Web search** = any search phrase ("BNB top gainers today")
4. **Lurky** = has sentiment filters (bullish/bearish)
5. **Protokols** = best for KOL opinions and narratives
6. **TON APIs** = only for TON blockchain questions
7. **Portfolio APIs** = require wallet address

---

## ✅ **WHAT THIS ENABLES**

With this complete API list, the Reasoning Agent can:
- Generate SPECIFIC queries for SPECIFIC APIs
- Route questions to the BEST data source
- Combine multiple APIs for comprehensive answers
- Use cached data when available
- Make intelligent decisions about which APIs to call

**No more generic "trending" requests - now we have 20+ specific APIs to choose from!** 🚀
