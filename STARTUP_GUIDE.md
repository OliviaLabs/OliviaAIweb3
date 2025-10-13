# 🚀 Enhanced AI System - Startup Guide

## What Happens When You Start the Server

When you run `npm start` or restart the microservice, the enhanced AI system **automatically initializes** with all 10 improvements.

---

## Startup Console Output

You'll see this when the server starts:

```
🤖 Initializing Enhanced AI Agent System...
  ✅ Structured intent extraction (function calling)
  ✅ Input normalization & language detection
  ✅ Smart routing (trade vs info)
  ✅ Entity propagation through pipeline
  ✅ Collision-resistant caching
  ✅ Resilience (timeouts, retries, circuit breakers)
  ✅ Follow-up intelligence (no repeats)
  ✅ Multilingual support (10+ languages)
  ✅ Parameter validation & sanitization
  ✅ Full observability (traceId, metrics, structured logs)
🎯 Enhanced AI system ready!

🚀 ============================================
🚀 OpenAI Microservice Started
🚀 ============================================
📡 Server: http://localhost:3000
📊 Environment: development
🔒 CORS origin: http://localhost:5173
⚡ Rate limit: 100 req/60s

🌐 WebSocket:
  Proxy: ws://localhost:3000/ws
  Stats: http://localhost:3000/api/websocket/stats

🏥 Endpoints:
  Health: http://localhost:3000/api/health
  Docs: http://localhost:3000/api

🤖 Enhanced AI Endpoints:
  Smart Chat: POST http://localhost:3000/api/openai/smart-chat
  Multi-Agent: POST http://localhost:3000/api/openai/multi-agent
  Trading: POST http://localhost:3000/api/openai/chat/completions

✨ Enhanced Features Active:
  • Structured intent (no parsing errors)
  • Auto language detection & translation
  • Smart routing (trade vs info)
  • Resilience (timeout, retry, circuit breaker)
  • Full observability (traceId, metrics)
🚀 ============================================

📊 Metrics initialized: {
  requests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  apiFreshFetches: 0,
  apiFailures: 0,
  circuitBreakerOpens: 0,
  totalLatencyMs: 0,
  stageLatency: {}
}
```

---

## How to Start the Server

### Option 1: Development Mode
```bash
cd microservice
npm run dev
# or
npm start
```

### Option 2: Production Mode
```bash
cd microservice
NODE_ENV=production npm start
```

### Option 3: With PM2 (Recommended for Production)
```bash
cd microservice
pm2 start src/server.js --name olivia-microservice
pm2 logs olivia-microservice  # See the startup logs
```

---

## What Gets Initialized Automatically

### 1. Metrics Collector ✅
- Tracks: requests, cache hits/misses, API failures, latencies
- Resets on server restart (in-memory)
- Access via: `globalMetrics.getSnapshot()`

### 2. Circuit Breaker ✅
- Monitors all API endpoints
- Opens after 5 consecutive failures
- Stays open for 60 seconds
- Resets on server restart

### 3. Routes ✅
- `/api/openai/smart-chat` - New intelligent endpoint
- `/api/openai/multi-agent` - Enhanced with traceId
- `/api/openai/chat/completions` - Trading tools

### 4. All Utilities ✅
- Input normalizer
- Language detector
- Resilience wrapper
- Trace logger
- Param guards

---

## During Runtime

### Structured Logs (JSON Format)
Every request generates structured logs:

```json
{
  "level": "info",
  "traceId": "1696847234-x7k3m",
  "stage": "reasoning-intent",
  "message": "Stage completed",
  "durationMs": 342,
  "timestamp": "2025-10-13T12:34:56.789Z"
}
```

### Metrics Tracking
The system tracks:
- Cache hit rate
- API failure rate
- Average latency per stage
- Circuit breaker opens

### Real-Time Observability
```bash
# Watch logs
npm start | grep traceId

# Check metrics (in another terminal)
curl http://localhost:3000/api/websocket/stats
```

---

## On Shutdown

When you stop the server (Ctrl+C), you'll see:

```
🛑 ============================================
🛑 Shutting down gracefully...
🛑 ============================================

📊 Final Metrics:
{
  "requests": 47,
  "cacheHits": 23,
  "cacheMisses": 18,
  "apiFreshFetches": 18,
  "apiFailures": 2,
  "circuitBreakerOpens": 0,
  "totalLatencyMs": 134789,
  "avgLatencyMs": 2868,
  "cacheHitRate": 56,
  "stageAvgLatencyMs": {
    "reasoning-intent": 342,
    "api-selection": 12,
    "api-execution": 1834,
    "data-filtering": 45,
    "response-formatting": 614
  }
}

🧯 Circuit Breaker States:
  (Circuit breakers will be logged if any were opened)

🔌 WebSocket server closed
🚀 HTTP server closed
✅ Shutdown complete
```

---

## Testing After Startup

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Test Smart Chat (English)
```bash
curl -X POST http://localhost:3000/api/openai/smart-chat \
  -H "Content-Type: application/json" \
  -H "admin-secret: YOUR_SECRET" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is Bitcoin price?"}
    ]
  }'
```

### 3. Test Language Detection (Spanish)
```bash
curl -X POST http://localhost:3000/api/openai/smart-chat \
  -H "Content-Type: application/json" \
  -H "admin-secret: YOUR_SECRET" \
  -d '{
    "messages": [
      {"role": "user", "content": "¿Cuál es el precio de Bitcoin?"}
    ]
  }'
```

### 4. Check Response Has TraceID
Look for `"traceId": "1696847234-x7k3m"` in the response.

---

## Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Restart
npm start
```

### Enhanced Features Not Showing
```bash
# Make sure you're in the right directory
pwd
# Should be: .../OliviaAIweb3/microservice

# Check node_modules exist
ls node_modules/

# Reinstall if needed
npm install
```

### Imports Failing
```bash
# Check file exists
ls src/utils/trace.js
ls src/agents/utils/resilience.js
ls src/agents/utils/inputNormalizer.js

# If missing, they were created - check git status
git status
```

---

## Environment Variables

All features work with default config, but you can customize:

```bash
# Optional: Adjust timeouts
export API_TIMEOUT_MS=5000

# Optional: Circuit breaker settings
export CIRCUIT_BREAKER_THRESHOLD=5
export CIRCUIT_BREAKER_RESET_MS=60000

# Optional: Cache TTL
export CACHE_TTL_MS=300000  # 5 minutes
```

---

## Monitoring in Production

### With PM2
```bash
# View logs
pm2 logs olivia-microservice

# Monitor metrics
pm2 monit

# Restart if needed
pm2 restart olivia-microservice
```

### With Docker
```bash
# View logs
docker logs -f olivia-microservice

# Restart
docker restart olivia-microservice
```

---

## Success Indicators

✅ **Server started successfully if you see:**
- "Enhanced AI system ready!"
- All 10 feature checkmarks
- Smart Chat endpoint listed
- Metrics initialized to 0

✅ **System working correctly if:**
- Requests have traceId in logs
- Structured JSON logs appearing
- Metrics incrementing on requests
- No "Circuit breaker open" warnings (unless APIs are actually down)

---

## What's Automatic vs Manual

### Automatic (No Action Needed) ✅
- All imports load on server start
- Metrics initialize to zero
- Circuit breakers start closed
- Routes register automatically
- All utilities ready to use

### Manual (You Control)
- When to use `/smart-chat` vs `/multi-agent`
- Reviewing metrics (call `globalMetrics.getSnapshot()`)
- Adjusting timeouts/retries (edit resilience.js)
- Tuning cache TTL (edit apiControlAgent.js)

---

## Next Steps After Startup

1. **Test with real queries** - Try different languages
2. **Monitor metrics** - Watch the console for patterns
3. **Check traceIds** - Verify observability working
4. **Stress test** - Send many requests to test resilience
5. **Review logs** - Confirm structured logging

---

**The enhanced AI system is now fully integrated and runs automatically on server start! 🚀**

