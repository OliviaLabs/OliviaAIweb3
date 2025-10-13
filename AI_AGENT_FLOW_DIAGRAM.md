# AI Agent System Flow Diagram

## 🎯 Smart Chat Flow (New Unified Endpoint)

```
User Input (any language, messy text)
    ↓
┌─────────────────────────────────────┐
│   Input Normalizer & Classifier    │
│  • Trim, normalize whitespace       │
│  • Detect language (10+ languages)  │
│  • Classify: "trade" vs "info"     │
│  • Safety checks (injection, etc.)  │
└─────────────────────────────────────┘
    ↓
    ├─ kind = "trade"? ───────────┐
    │                             ↓
    │                    ┌──────────────────┐
    │                    │  Trading Tools   │
    │                    │  Function Calls  │
    │                    │  (getSwapPrice,  │
    │                    │   executeSwap)   │
    │                    └──────────────────┘
    │                             ↓
    │                      [Response + TX data]
    │
    └─ kind = "info" ──────────────────────┐
                                           ↓
                              ┌─────────────────────────┐
                              │  Multi-Agent Pipeline   │
                              │  (5-Stage Process)      │
                              └─────────────────────────┘
                                           ↓
                                    [See below ↓]
```

---

## 🤖 Multi-Agent Pipeline (5 Stages)

```
Stage 1: Reasoning Agent (Intent Analysis)
┌───────────────────────────────────────────────────────┐
│  • Uses function calling (structured JSON)            │
│  • Extracts: user_wants, data_types, entities,        │
│    urgency, is_follow_up, continuation_context        │
│  • Safe fallback if tool call fails                   │
│  📊 Metrics: reasoning-intent latency                 │
└───────────────────────────────────────────────────────┘
         ↓
Stage 2: Call Everything Agent (API Selection)
┌───────────────────────────────────────────────────────┐
│  • Builds list of ALL relevant API calls              │
│  • Attaches entities to each call                     │
│  • Returns 8-20 API calls with params                 │
│  📊 Metrics: api-selection latency                    │
└───────────────────────────────────────────────────────┘
         ↓
Stage 3: API Control Agent (Execution + Resilience)
┌───────────────────────────────────────────────────────┐
│  For EACH API call:                                    │
│  1. Generate cache key (dataType|endpoint|params|ents) │
│  2. Check cache (5min TTL)                            │
│     └─ Hit? → Return cached data ✅                   │
│  3. Enhance params with TokenResolverAgent            │
│  4. Execute with resilience:                          │
│     • Timeout: 5 seconds                              │
│     • Retry: 2 attempts with backoff                  │
│     • Circuit breaker: Opens after 5 failures         │
│  5. Store result in cache                             │
│  📊 Metrics: api-execution, cache hits/misses         │
└───────────────────────────────────────────────────────┘
         ↓
Stage 4: Reasoning Agent (Data Filtering)
┌───────────────────────────────────────────────────────┐
│  • Filters raw data to only what user needs           │
│  • Keeps all successful data for comprehensive reply  │
│  📊 Metrics: data-filtering latency                   │
└───────────────────────────────────────────────────────┘
         ↓
Stage 5: Frontend Agent (Response Formatting)
┌───────────────────────────────────────────────────────┐
│  • Detects language from context                      │
│  • Extracts previously mentioned items                │
│  • Formats response in user's language                │
│  • Follow-up: Shows DIFFERENT items (no repeats)      │
│  📊 Metrics: response-formatting latency              │
└───────────────────────────────────────────────────────┘
         ↓
    Final Response
    + Metadata
    + TraceID
```

---

## 🔍 Observability Flow

```
Request Arrives
    ↓
Generate TraceID (e.g., "1696847234-x7k3m")
    ↓
TraceID flows through ALL stages
    ↓
Each stage logs:
  • Start: { traceId, stage, message: "Started" }
  • Complete: { traceId, stage, durationMs }
  • Error: { traceId, stage, error, stack }
    ↓
Global Metrics Collector tracks:
  • requests, cacheHits, cacheMisses
  • apiFreshFetches, apiFailures
  • circuitBreakerOpens
  • latency per stage
    ↓
End of request: Log metrics summary
```

---

## 🛡️ Resilience Flow

```
API Call Needed
    ↓
Check Circuit Breaker
    ├─ Open? → Skip, return error
    └─ Closed? → Proceed
         ↓
Execute with Timeout (5s)
    ├─ Success? → Record success, cache, return
    ├─ Timeout? → Retry (max 2)
    │      ├─ Retry 1: Wait 500ms + jitter
    │      ├─ Retry 2: Wait 1000ms + jitter
    │      └─ Still fails? → Record failure
    │           ↓
    │      Circuit breaker tracks failures
    │           ↓
    │      5 failures? → Open circuit for 60s
    └─ Error? → Same as timeout
         ↓
Pipeline continues with partial data
(One bad API never crashes the whole system)
```

---

## 🌐 Language Detection Flow

```
User Input: "¿Cuáles son las monedas más populares?"
    ↓
InputNormalizer.detectLanguage()
    ├─ Check Cyrillic % → ru?
    ├─ Check Chinese % → zh?
    ├─ Check Japanese % → ja?
    ├─ Check Korean % → ko?
    ├─ Check Arabic % → ar?
    ├─ Check Spanish keywords → es? ✅
    ├─ Check French keywords → fr?
    ├─ Check German keywords → de?
    └─ Default: en
         ↓
Language = "es"
    ↓
Pass to FrontendAgent: userContext.language = "es"
    ↓
System prompt: "🌐 RESPOND IN: Spanish"
    ↓
Response: "Las monedas más populares son..."
```

---

## 📋 Follow-Up Intelligence Flow

```
Conversation:
User: "What's pumping on TON?"
Assistant: "Here are the top 5: NOT, DOGS, HMSTR, BOLT, REDO"

User: "What other ones?" (follow-up)
    ↓
ReasoningAgent.analyzeIntent()
    ├─ Checks conversation history
    ├─ Detects: is_follow_up = true
    └─ continuation_context = "trending TON tokens"
         ↓
FrontendAgent.extractPreviouslyMentionedItems()
    ├─ Scans last 2 assistant messages
    ├─ Extracts tokens: ["NOT", "DOGS", "HMSTR", "BOLT", "REDO"]
    └─ Returns: previouslyMentioned = ["NOT", "DOGS", "HMSTR", "BOLT", "REDO"]
         ↓
System prompt:
"PREVIOUSLY MENTIONED (DO NOT REPEAT): NOT, DOGS, HMSTR, BOLT, REDO
Show DIFFERENT items from the data."
    ↓
Assistant: "Sure! Here are more: JET, SCALE, PUNK, FROG, FISH..."
```

---

## 🗂️ Cache Key Generation

```
API Call:
{
  dataType: "price",
  endpoint: "/api/coingecko/prices",
  params: { ids: "bitcoin" },
  entities: { tokens: ["BTC"], blockchains: [], other: [] }
}
    ↓
generateCacheKey():
    base = "price|/api/coingecko/prices|{\"ids\":\"bitcoin\"}"
    entities = "{\"t\":[\"BTC\"],\"b\":[],\"o\":[]}"
    fullKey = base + "|" + entities
    ↓
    Is length > 200?
    ├─ Yes → Hash to: "price_7a3f2c1"
    └─ No → Return full key
         ↓
Cache Key: "price|/api/coingecko/prices|{\"ids\":\"bitcoin\"}|{\"t\":[\"BTC\"],\"b\":[],\"o\":[]}"
```

---

## 📊 Metrics Collection

```
Request Start
    ↓
globalMetrics.increment('requests')
    ↓
For each cache check:
    ├─ Hit? → globalMetrics.increment('cacheHits')
    └─ Miss? → globalMetrics.increment('cacheMisses')
         ↓
For each API fetch:
    ├─ Success? → globalMetrics.increment('apiFreshFetches')
    └─ Failure? → globalMetrics.increment('apiFailures')
         ↓
For each circuit breaker open:
    globalMetrics.increment('circuitBreakerOpens')
         ↓
For each stage complete:
    globalMetrics.recordLatency(stage, durationMs)
         ↓
Request End:
    globalMetrics.logSummary(traceId)
         ↓
Output:
{
  "requests": 1,
  "cacheHits": 3,
  "cacheMisses": 5,
  "apiFreshFetches": 5,
  "apiFailures": 1,
  "cacheHitRate": 38,
  "avgLatencyMs": 2847,
  "stageAvgLatencyMs": {
    "reasoning-intent": 342,
    "api-selection": 12,
    "api-execution": 1834,
    "data-filtering": 45,
    "response-formatting": 614
  }
}
```

---

## 🎯 Complete Request Example

```
POST /api/openai/smart-chat
Body: {
  "messages": [{ "role": "user", "content": "¿Qué está subiendo en Solana?" }]
}
    ↓
1. Generate traceId: "1696847234-x7k3m"
    ↓
2. Normalize input:
   Original: "¿Qué está subiendo en Solana?"
   Normalized: "¿Qué está subiendo en Solana?"
   Language: "es"
   Kind: "info"
    ↓
3. Route to multi-agent pipeline
    ↓
4. Stage 1 - Reasoning (342ms)
   Intent: { user_wants: "trending tokens on Solana", entities: { blockchains: ["Solana"] } }
    ↓
5. Stage 2 - API Selection (12ms)
   Planned: 8 API calls with entities attached
    ↓
6. Stage 3 - API Execution (1834ms)
   Cache hits: 3, Fresh fetches: 5, Failures: 0
    ↓
7. Stage 4 - Data Filtering (45ms)
   Filtered: ["trendingData", "marketCapData", "priceData"]
    ↓
8. Stage 5 - Response Formatting (614ms)
   Language: "es"
   Response: "Las criptomonedas que están subiendo en Solana incluyen JUP, BONK, WIF..."
    ↓
9. Log metrics summary
    ↓
Response:
{
  "success": true,
  "data": {
    "choices": [{
      "message": {
        "role": "assistant",
        "content": "Las criptomonedas que están subiendo en Solana incluyen JUP, BONK, WIF..."
      }
    }],
    "metadata": {
      "traceId": "1696847234-x7k3m",
      "durationMs": 2847
    }
  }
}
```

---

## 🚀 Key Improvements Visualized

### Before
```
User Input → Parse JSON? → ❌ Error (brittle)
User Input → Cache → ❌ Collision (wrong data)
API Timeout → ❌ Pipeline hangs
API Failure → ❌ Entire response fails
Follow-up → ✅ But repeats same items
Language → ✅ Always English
Debug → ❌ No visibility
```

### After
```
User Input → Structured tool → ✅ Always valid JSON
User Input → Cache (with key) → ✅ Zero collisions
API Timeout → ✅ Retry + fallback
API Failure → ✅ Continue with partial data
Follow-up → ✅ Shows NEW items
Language → ✅ Auto-detects, responds in user's language
Debug → ✅ TraceID + metrics per stage
```

---

**This system is now production-ready, resilient, and fully observable! 🎉**

