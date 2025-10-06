# Quick Start: Olivia AI Agent System
## Get the multi-agent architecture running in 1 hour

---

## OVERVIEW

This guide will walk you through implementing the 4-agent system that solves all current AI intelligence problems:

```
User Question
    ↓
[Intent Agent] → Understands what user REALLY wants
    ↓
[Data Router] → Calls only relevant APIs (not all 22)
    ↓
[Analyst Agent] → Extracts insights with evidence
    ↓
[Response Agent] → Crafts natural response
    ↓
User receives answer
```

---

## PART 1: BACKEND SETUP (30 min)

### Step 1: Create Agent Files (5 min)

```bash
cd microservice/src

# Create agents directory
mkdir -p agents

# Create the 4 agent files
touch agents/intentAgent.js
touch agents/analystAgent.js
touch agents/responseAgent.js

# Create data router service
touch services/dataRouterService.js

# Create agent controller and routes
touch controllers/agentController.js
touch routes/agentRoutes.js
```

### Step 2: Copy Agent Code (10 min)

**Copy from `IMPLEMENTATION_PLAN.md` to these files**:

1. `agents/intentAgent.js` → Full Intent Agent code
2. `services/dataRouterService.js` → Full Data Router code
3. `agents/analystAgent.js` → Full Analyst Agent code
4. `agents/responseAgent.js` → Full Response Agent code

**Copy from `IMPLEMENTATION_PART2.md` to these files**:

5. `controllers/agentController.js` → Full Agent Controller code
6. `routes/agentRoutes.js` → Agent Routes code

### Step 3: Register Routes (2 min)

**Edit**: `microservice/src/routes/index.js`

Add at the top with other imports:
```javascript
import agentRoutes from './agentRoutes.js';
```

Add FIRST in the router (before other routes):
```javascript
// Multi-Agent System (NEW)
router.use('/agent', agentRoutes);
```

### Step 4: Test Backend (3 min)

```bash
cd microservice
npm start
```

Open: http://localhost:3001/api/agent/health

Should see:
```json
{
  "success": true,
  "data": {
    "agent_system": "operational",
    "agents": {
      "intent": "ready",
      "data_router": "ready",
      "analyst": "ready",
      "response": "ready"
    }
  }
}
```

### Step 5: Test Intent Classification (5 min)

```bash
curl -X POST http://localhost:3001/api/agent/test-intent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What'\''s pumping on TON?"
  }'
```

Should return:
```json
{
  "success": true,
  "data": {
    "intent": {
      "intent_type": "trending_ecosystem",
      "target": {
        "type": "blockchain_ecosystem",
        "blockchain": "TON"
      }
    }
  }
}
```

✅ **If you see this, backend is working!**

### Step 6: Test Full Agent System (5 min)

```bash
curl -X POST http://localhost:3001/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Bitcoin doing today?",
    "conversationHistory": []
  }'
```

Should return a full response with:
- `message`: Natural language answer
- `intent`: Classification
- `analysis`: Key findings
- `debug`: Timing info

---

## PART 2: FRONTEND INTEGRATION (20 min)

### Step 1: Create Agent Service (3 min)

```bash
cd src/api/services
touch agentService.js
```

Copy the full `agentService.js` code from `IMPLEMENTATION_PART2.md`.

### Step 2: Update Home.jsx (10 min)

**Edit**: `src/pages/Home.jsx`

Add import at the top:
```javascript
import agentService from '../api/services/agentService';
```

Find the section around line 3822 that starts with:
```javascript
// 🚀 SEND TO AI VIA HTTP (replaced WebSocket)
```

**Replace the entire try/catch block** with the agent system code from `IMPLEMENTATION_PART2.md` (Step 2.2).

Key changes:
1. Call `agentService.chat()` instead of OpenAI direct
2. Pass `conversationHistory`, `activeToken`, `walletAddress`
3. Use `agentResponse.message` as the AI response
4. Log intent and debug info

### Step 3: Add Loading States (5 min)

At the top of `Home.jsx` with other state:
```javascript
const [agentStatus, setAgentStatus] = useState('idle');
```

In the agent call, add status updates:
```javascript
setAgentStatus('fetching');
const agentResponse = await agentService.chat(...);
setAgentStatus('analyzing');
// ... use response ...
setAgentStatus('idle');
```

### Step 4: Test Frontend (2 min)

```bash
cd ../..  # Back to root
npm run dev
```

Open: http://localhost:5173

Try: **"What's pumping on TON?"**

Watch console for:
```
🤖 [Agent Service] Sending to agent system: What's pumping on TON?
✅ [Agent Service] Response received
   Intent: trending_ecosystem
   API calls: 4
   Time: 3245ms
```

---

## PART 3: TESTING (10 min)

### Test Case 1: Ecosystem Query ✅
**Input**: "What's pumping on TON?"  
**Expected**: Lists TON ecosystem tokens (DOGS, NOT, STON), not TON token itself  
**Check**: Console shows `intent_type: trending_ecosystem`

### Test Case 2: Specific Token ✅
**Input**: "Why is Corn pumping?"  
**Expected**: Explains with specific prices, tweets, news  
**Check**: Response cites actual numbers and sources

### Test Case 3: Follow-up ✅
**First**: AI says "Have you seen Corn pumping?"  
**Input**: "yeah"  
**Expected**: Provides details about Corn (not asks "what do you mean?")  
**Check**: Console shows `references_previous_token: CORN`

### Test Case 4: Generic ✅
**Input**: "Hello"  
**Expected**: Normal greeting  
**Check**: No unnecessary API calls

### Test Case 5: Comparison ✅
**Input**: "Compare BTC and ETH"  
**Expected**: Side-by-side comparison  
**Check**: Fetches data for both tokens

---

## TROUBLESHOOTING

### Backend Issues:

**Error**: `Cannot find module './agents/intentAgent.js'`
- **Fix**: Make sure file exists and path is correct (check imports)

**Error**: `openai.chat.completions.create is not a function`
- **Fix**: Ensure OpenAI package is installed: `npm install openai`

**Error**: `OPENAI_API_KEY not configured`
- **Fix**: Check `.env` file has `OPENAI_API_KEY=sk-...`

**Error**: All API calls timeout
- **Fix**: Increase timeout in `dataRouterService.js`: `max_wait: 5000`

### Frontend Issues:

**Error**: `agentService is not defined`
- **Fix**: Check import path in `Home.jsx`

**Error**: `Cannot read property 'message' of undefined`
- **Fix**: Check `agentResponse.data.message` vs `agentResponse.message`

**Error**: Blank response
- **Fix**: Open browser console, check for errors, look at network tab

### Intent Classification Issues:

**Problem**: Intent Agent classifies "What's pumping on TON?" as `specific_token` (TON) instead of `trending_ecosystem`

**Fix**: Strengthen system prompt in `intentAgent.js`:
```javascript
"What's pumping on TON?" = trending tokens IN TON ecosystem (trending_ecosystem)
"How is TON doing?" = specific TON token analysis (specific_token)
```

### Response Quality Issues:

**Problem**: Responses still have emojis or section headers

**Fix**: Check `responseAgent.js` system prompt has:
```javascript
❌ DO NOT:
- Use ANY emojis (no ✅📈🔴💰🎯)
- Use section headers (not even **BOLD**)
```

---

## MONITORING

### What to Watch:

**Console Logs**:
```
✅ [Agent System] Complete in 3245ms  ← Should be < 5000ms
✅ [Intent Agent] Classified as: trending_ecosystem  ← Check accuracy
✅ [Data Router] Results: 3/4 successful  ← Should be > 50%
```

**Error Logs**:
```
❌ [Agent System] Fatal error: ...  ← Investigate immediately
❌ All API calls failed  ← Check API keys/network
⏱️ API timeout  ← May need to increase max_wait
```

---

## DEPLOYMENT TO RENDER

### Step 1: Push to GitHub

```bash
git add .
git commit -m "🤖 Add multi-agent architecture

- Intent Agent: Classify user intent with GPT-4o
- Data Router: Smart API call routing
- Analyst Agent: Extract insights with evidence
- Response Agent: Natural language generation

Fixes:
- 'What's pumping on TON?' now returns ecosystem tokens
- Follow-up questions maintain context
- AI provides specific evidence-based answers"

git push origin navigation-ai-
```

### Step 2: Wait for Render Deploy

- Render will auto-detect changes
- Wait 3-5 minutes for build
- Check: https://oliviaaiweb3-1.onrender.com/api/agent/health

### Step 3: Test Live

Open your deployed app: https://oliviaaiweb3-1.onrender.com/home

Try: **"What's pumping on TON?"**

---

## ROLLBACK PLAN

If something breaks:

### Option 1: Feature Flag (Recommended)

In `Home.jsx`, add at the top:
```javascript
const USE_AGENT_SYSTEM = true; // Set to false to revert
```

Then:
```javascript
if (USE_AGENT_SYSTEM) {
  // Agent system call
  const agentResponse = await agentService.chat(...);
} else {
  // Old OpenAI direct call
  const response = await fetch('/api/openai/chat/completions', ...);
}
```

### Option 2: Git Revert

```bash
git revert HEAD
git push origin navigation-ai-
```

### Option 3: Render Manual Rollback

1. Go to Render dashboard
2. Find "oliviaaiweb3-1" service
3. Click "Manual Deploy"
4. Select previous successful commit

---

## SUCCESS METRICS

After deploying, check:

✅ **Accuracy**: "What's pumping on TON?" returns correct tokens  
✅ **Context**: Follow-up "why?" maintains context  
✅ **Quality**: Responses cite specific numbers  
✅ **Style**: No emojis, no headers  
✅ **Speed**: < 5 seconds response time  
✅ **Reliability**: > 50% API success rate  

---

## NEXT STEPS

Once core system is stable:

1. **Add Caching** (improve speed by 50%):
   - Cache intent classifications
   - Cache API responses (1-5 min)

2. **Portfolio Integration**:
   - Auto-show P&L when user asks about token they hold
   - "You hold 100 CORN worth $12.74, up $3.45 today"

3. **Proactive Insights**:
   - Background job: check portfolio every 5 min
   - Notify if any token pumps >20%

4. **Multi-Turn Reasoning**:
   - AI can request more data mid-conversation
   - "Let me check the latest news..." → makes additional API call

5. **Learning System**:
   - Track which API combinations work best
   - Optimize routing based on success rates

---

## GETTING HELP

If you get stuck:

1. **Check console logs** - Most issues show clear error messages
2. **Test endpoints individually** - Use curl to test `/api/agent/test-intent`
3. **Verify environment variables** - Ensure all API keys are set
4. **Check network tab** - See exact request/response in browser
5. **Read error messages carefully** - They usually point to the exact issue

---

## FINAL CHECKLIST

Before considering this complete:

- [ ] Backend `/api/agent/health` returns success
- [ ] Intent test returns correct classification
- [ ] Full agent chat returns structured response
- [ ] Frontend console shows agent logs
- [ ] "What's pumping on TON?" works correctly
- [ ] Follow-up questions maintain context
- [ ] Responses are natural (no emojis, no headers)
- [ ] Response time < 5 seconds
- [ ] Deployed to Render successfully
- [ ] Live app works as expected

---

## ESTIMATED TIME

- **Backend Setup**: 30 minutes
- **Frontend Integration**: 20 minutes
- **Testing**: 10 minutes
- **Deployment**: 5 minutes
- **Buffer**: 5 minutes

**Total**: ~70 minutes

---

## YOU'RE READY! 🚀

This architecture will solve:
- ✅ Intent understanding issues
- ✅ Context loss on follow-ups
- ✅ Generic responses without evidence
- ✅ Wrong token interpretation

Start with **Part 1: Backend Setup** and work through each step.

The system is designed to fail gracefully, so even partial implementation will work better than the current system.

Good luck! 💪

