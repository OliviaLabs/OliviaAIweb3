# Explore Page Setup Guide

This guide will help you set up the new Explore page feature that shows who's talking about crypto tokens on Twitter/X.

## Overview

The Explore page now includes:
- **Bubble Map**: Shows trending tokens based on Twitter mentions
- **Token Speakers**: Click any bubble to see who's talking about that token
- **Community-Driven**: Users can submit influencers to track
- **Real Data**: Powered by snscrape + PostgreSQL

---

## 1. Database Setup

### Option A: Using Render (Recommended for Production)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create a new PostgreSQL database
3. Copy the **Internal Database URL**
4. Add to your `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

### Option B: Local PostgreSQL

1. Install PostgreSQL:
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Create database
   createdb olivia_explore
   ```

2. Add to `.env`:
   ```env
   DATABASE_URL=postgresql://localhost:5432/olivia_explore
   ```

### Create Database Tables

Run the schema:
```bash
cd microservice
psql $DATABASE_URL < src/db/schema.sql
```

Or if you get errors, copy the SQL and run it manually in your database client.

---

## 2. Backend Setup

### Install Dependencies

```bash
cd microservice
npm install pg pg-hstore
```

### Update microservice server

The database connection is already configured in `/microservice/src/config/database.js`.

Test the connection:
```bash
cd microservice
npm run dev
```

You should see:
```
✅ Database connected successfully
```

---

## 3. Python Scraper Setup

### Install Python Requirements

```bash
cd scripts/scraper
chmod +x setup.sh
./setup.sh
```

This will:
- Create a Python virtual environment
- Install snscrape, psycopg2, etc.

### Test the Scraper

```bash
cd scripts/scraper
source venv/bin/activate
python token_scraper.py
```

**First run will:**
- Scrape tweets from the 20 pre-seeded influencers
- Extract $TOKEN mentions
- Store in database
- Takes about 2-5 minutes

---

## 4. Frontend Setup

### Add Environment Variable

Add to your root `.env`:
```env
VITE_MICROSERVICE_URL=http://localhost:3001/api
VITE_ADMIN_ACCESS_SECRET=your_admin_secret_here
```

### Test Frontend

1. Start the microservice:
   ```bash
   cd microservice
   npm run dev
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Navigate to `/explore` page
4. Click any bubble to see speakers!

---

## 5. Automation (Optional)

### Set up Cron Job

To run the scraper every 6 hours:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path):
0 */6 * * * cd /path/to/OliviaAIweb3/scripts/scraper && source venv/bin/activate && python token_scraper.py >> scraper.log 2>&1
```

This will run at:
- 12:00 AM
- 6:00 AM
- 12:00 PM
- 6:00 PM

---

## 6. Verify Everything Works

### Test Checklist:

- [ ] Database connection working
- [ ] Backend API responds: `curl http://localhost:3001/api/explore/bubble-data`
- [ ] Scraper runs successfully
- [ ] Frontend shows bubbles on Explore page
- [ ] Clicking bubble opens drawer with speakers
- [ ] Speakers have correct data (tweets, engagement, followers)

---

## API Endpoints

### Explore API (Only used by Explore page)

```
GET  /api/explore/bubble-data
     Returns: Token bubble data for map

GET  /api/explore/token-speakers/:symbol
     Returns: Who's talking about this token

POST /api/explore/submit-influencer
     Body: { twitter_handle, user_id, reason }
     Requires: x-admin-secret header

GET  /api/explore/tracked-influencers
     Returns: List of tracked influencers
```

---

## Troubleshooting

### Database connection fails
```bash
# Test connection manually
psql $DATABASE_URL -c "SELECT NOW();"
```

### Scraper fails with "snscrape command not found"
```bash
cd scripts/scraper
source venv/bin/activate
pip install --upgrade snscrape
```

### No bubbles showing
1. Check database has data: `SELECT COUNT(*) FROM token_mentions;`
2. If empty, run scraper again
3. Check browser console for API errors

### Scraper too slow
Edit `scripts/scraper/token_scraper.py`:
```python
TWEETS_PER_INFLUENCER = 25  # Reduce from 50
DELAY_BETWEEN_SCRAPES = 0.2  # Reduce from 0.5
```

---

## Next Steps

### Add More Influencers

1. Go to Explore page
2. Click "Add Influencer" (coming soon)
3. Enter Twitter handle
4. Wait for approval
5. Scraper will include them in next run

### Monitor Performance

Check scraper logs:
```sql
SELECT * FROM scraper_logs ORDER BY run_started_at DESC LIMIT 5;
```

Check top tokens:
```sql
SELECT * FROM tokens_metadata 
ORDER BY total_mentions_24h DESC 
LIMIT 10;
```

---

## Architecture Summary

```
┌─────────────────────────────────────┐
│  Explore Page (Frontend)            │
│  - Bubble map                       │
│  - Click → Token Speakers Drawer    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Microservice API                   │
│  GET /api/explore/bubble-data       │
│  GET /api/explore/token-speakers    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  PostgreSQL Database                │
│  - tracked_influencers              │
│  - token_mentions                   │
│  - tokens_metadata                  │
└─────────────────────────────────────┘
              ↑
┌─────────────────────────────────────┐
│  Python Scraper (Cron Job)          │
│  - Runs every 6 hours               │
│  - Scrapes Twitter with snscrape    │
│  - Stores mentions in DB            │
└─────────────────────────────────────┘
```

---

## Support

If you run into issues:
1. Check the scraper logs: `scripts/scraper/scraper.log`
2. Check database logs in Render dashboard
3. Check browser console for frontend errors
4. Check microservice console for API errors

**The Explore page is completely isolated from the Home page and won't affect existing functionality!**

