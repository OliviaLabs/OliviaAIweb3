# 🚀 Explore Page - Token Speakers Feature

## ✅ What's Been Built

A complete community-driven system for tracking who's talking about crypto tokens on Twitter/X.

---

## 📦 Features Completed

### 1. **Interactive Bubble Map**
- Shows trending tokens based on real Twitter mentions
- Bubble size = number of mentions in last 24h
- Click any bubble to see who's talking about it
- Real-time data from database

### 2. **Token Speakers Drawer**
- See top speakers for any token
- Ranked by engagement score (not just followers)
- Filter by: All / Verified / Trusted
- Shows:
  - Number of tweets about the token
  - Average likes/retweets
  - Follower count
  - Total engagement score
- Click speaker to view their X profile

### 3. **Community Submissions**
- "Track Influencer" button on Explore page
- Users can submit new Twitter accounts to track
- Auto-approval for verified accounts with 50K+ followers
- Manual review queue for smaller accounts
- Prevents duplicates

### 4. **Backend API** (PostgreSQL + Node.js)
- `GET /api/explore/bubble-data` - Token mentions for bubble map
- `GET /api/explore/token-speakers/:symbol` - Who's talking about a token
- `POST /api/explore/submit-influencer` - Submit new influencer
- `GET /api/explore/tracked-influencers` - List all tracked accounts
- `GET /api/explore/user-submissions/:user_id` - User's submissions

### 5. **Twitter Scraper** (Python + snscrape)
- Scrapes tweets from all tracked influencers
- Extracts $TOKEN mentions automatically
- Calculates engagement scores
- Stores in PostgreSQL database
- Runs every 6 hours via cron job

### 6. **Database Schema** (PostgreSQL)
- `tracked_influencers` - Accounts being monitored
- `token_mentions` - All tweet mentions of tokens
- `tokens_metadata` - Token info and aggregated stats
- `user_submissions` - Community submissions queue
- `mention_aggregations` - Fast query cache
- `scraper_logs` - Scraper run history

---

## 📁 Files Created

### Backend
```
microservice/
├── src/
│   ├── config/
│   │   └── database.js                    # PostgreSQL connection
│   ├── controllers/
│   │   └── exploreController.js           # API controllers
│   ├── routes/
│   │   └── exploreRoutes.js               # API routes
│   └── db/
│       └── schema.sql                     # Database schema
```

### Frontend
```
src/
├── api/services/
│   └── explore.service.js                 # API service
├── components/features/explore/
│   ├── TokenSpeakersDrawer.jsx           # Shows speakers
│   ├── AddInfluencerModal.jsx            # Submit influencers
│   ├── BubbleMapSection.jsx              # Updated for new API
│   └── FloatingBubbles.jsx               # Made clickable
└── pages/
    └── Explore.jsx                        # Added modal button
```

### Python Scraper
```
scripts/
├── scraper/
│   ├── token_scraper.py                  # Main scraper
│   ├── requirements.txt                  # Python deps
│   ├── setup.sh                          # Setup script
│   └── README.md                         # Docs
├── run-scraper.sh                        # Cron runner
├── install-cron.sh                       # Install cron job
└── uninstall-cron.sh                     # Remove cron job
```

### Documentation
```
EXPLORE_SETUP_GUIDE.md                    # Setup instructions
EXPLORE_FEATURE_SUMMARY.md                # This file
```

---

## 🎯 How Users Experience It

### Step 1: View Trending Tokens
```
User visits /explore
   ↓
Sees bubble map with tokens ($BTC, $ETH, etc.)
Bubble size = how much it's being talked about
```

### Step 2: Discover Speakers
```
User clicks $SUI bubble
   ↓
Drawer opens showing top speakers:
  1. @CryptoWhale - 15 tweets, 250K followers
  2. @TraderJoe - 8 tweets, 50K followers
  3. @AltcoinDaily - 12 tweets, 1M followers
```

### Step 3: Contribute
```
User clicks "Track Influencer" button
   ↓
Enters @CryptoGuru handle
   ↓
Submits (auto-approved if verified)
   ↓
Shows up in next scraper run (within 6 hours)
```

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────┐
│  1. Community Submits Influencers       │
│     via AddInfluencerModal              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  2. Stored in user_submissions table    │
│     Status: pending / approved          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  3. Added to tracked_influencers        │
│     (auto or manual approval)           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  4. Python Scraper Runs (every 6h)      │
│     - Fetches last 50 tweets            │
│     - Extracts $TOKEN mentions          │
│     - Calculates engagement scores      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  5. Stores in token_mentions table      │
│     with engagement metrics             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  6. Updates tokens_metadata             │
│     total_mentions_24h, trending_score  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  7. Frontend fetches via API            │
│     GET /api/explore/bubble-data        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  8. User sees updated bubble map        │
│     and speaker rankings                │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Setup Database
```bash
# Create PostgreSQL database (Render or local)
# Add DATABASE_URL to .env

# Run schema
cd microservice
psql $DATABASE_URL < src/db/schema.sql
```

### 2. Install Dependencies
```bash
# Backend
cd microservice
npm install

# Scraper
cd ../scripts/scraper
./setup.sh
```

### 3. Run First Scrape
```bash
cd scripts/scraper
source venv/bin/activate
python token_scraper.py
# Takes 2-5 minutes, scrapes 20 pre-seeded influencers
```

### 4. Install Cron Job (Optional)
```bash
cd scripts
./install-cron.sh
# Runs scraper every 6 hours automatically
```

### 5. Start Services
```bash
# Terminal 1: Backend
cd microservice
npm run dev

# Terminal 2: Frontend
cd ../
npm run dev
```

### 6. Test It!
```
1. Go to http://localhost:5173/explore
2. See bubbles on the map
3. Click any bubble
4. See speakers drawer
5. Click "Track Influencer" to add new accounts
```

---

## 📊 Pre-Seeded Data

### 20 Whitelisted Influencers
- CryptoMichNL
- TheCryptoDog
- CryptoTony__
- CryptoDonAlt
- rektcapital
- Nebraskangooner
- DaanCrypto
- WendyO
- WClementeIII
- Pentoshi
- SalsaTekila
- tradingtank
- ilCapoOfCrypto
- AltcoinSherpa
- Roman_Trading
- KoroushAK
- SatoshiFlipper
- TheFlowHorse
- SmartContracter
- TraderSZ

### 13 Pre-Seeded Tokens
- BTC (Bitcoin)
- ETH (Ethereum)
- SOL (Solana)
- SUI (Sui)
- PEPE (Pepe)
- DOGE (Dogecoin)
- TON (Toncoin)
- ARB (Arbitrum)
- OP (Optimism)
- AVAX (Avalanche)
- SEI (Sei)
- ENA (Ethena)
- WIF (dogwifhat)

---

## 🛡️ What's Protected

### Zero Impact on Existing Features
- ✅ Home page unchanged
- ✅ Chat functionality unchanged
- ✅ Existing Twitter API unchanged
- ✅ All other routes unchanged
- ✅ Database completely separate

### Error Handling
- ✅ Graceful fallback if database not set up
- ✅ Empty state if no data
- ✅ Loading states
- ✅ Error messages for failed submissions

---

## 📈 Future Enhancements (Not Built Yet)

### Potential Improvements
- [ ] Admin dashboard to approve submissions
- [ ] User reputation system (reward good submissions)
- [ ] Sentiment analysis (positive/negative mentions)
- [ ] Historical trends (7d, 30d charts)
- [ ] Email alerts for new trending tokens
- [ ] Export data as CSV
- [ ] Speaker verification badges
- [ ] Token price overlay on bubble map

---

## 🔧 Maintenance

### Check Scraper Status
```sql
SELECT * FROM scraper_logs 
ORDER BY run_started_at DESC 
LIMIT 10;
```

### Top Tokens Today
```sql
SELECT symbol, total_mentions_24h, total_mentions_7d 
FROM tokens_metadata 
ORDER BY total_mentions_24h DESC 
LIMIT 20;
```

### Recent Submissions
```sql
SELECT twitter_handle, status, submitted_at 
FROM user_submissions 
ORDER BY submitted_at DESC 
LIMIT 20;
```

### Manually Approve Submission
```sql
-- Approve submission
UPDATE user_submissions 
SET status = 'approved', reviewed_at = NOW() 
WHERE id = 123;

-- Add to tracked influencers
INSERT INTO tracked_influencers (twitter_handle, status)
VALUES ('NewInfluencer', 'active');
```

---

## 📞 Support

For issues:
1. Check `scripts/scraper/scraper.log`
2. Check `scripts/scraper/scraper_error.log`
3. Check browser console
4. Check microservice console
5. Check database connection

---

## ✨ Summary

**You now have a fully functional, community-driven token sentiment tracker that:**
- Shows which tokens are being talked about
- Reveals who the key voices are
- Lets your community contribute influencers
- Updates automatically every 6 hours
- Provides accurate, data-driven insights
- Is completely isolated from the rest of your app

**It's production-ready and safe to deploy!** 🚀

