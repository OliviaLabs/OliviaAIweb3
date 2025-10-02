# Token Mentions Scraper

Scrapes Twitter for token mentions from tracked influencers using snscrape.

## Setup

1. **Install Python dependencies:**
```bash
chmod +x setup.sh
./setup.sh
```

2. **Set environment variable:**
```bash
# Add to your .env file in the root directory
DATABASE_URL=postgresql://user:password@host:port/database
```

3. **Run the scraper:**
```bash
source venv/bin/activate
python token_scraper.py
```

## How It Works

1. Queries database for all active tracked influencers
2. Scrapes last 50 tweets from each influencer (last 24h)
3. Extracts $TOKEN mentions from tweets
4. Calculates engagement scores
5. Stores mentions in `token_mentions` table
6. Updates aggregated stats in `tokens_metadata`

## Configuration

Edit `token_scraper.py` to adjust:
- `HOURS_BACK = 24` - How far back to scrape
- `TWEETS_PER_INFLUENCER = 50` - Max tweets per influencer
- `DELAY_BETWEEN_SCRAPES = 0.5` - Delay between requests (seconds)

## Automation (Cron Job)

To run every 6 hours:

```bash
# Edit crontab
crontab -e

# Add this line:
0 */6 * * * cd /path/to/OliviaAIweb3/scripts/scraper && source venv/bin/activate && python token_scraper.py >> scraper.log 2>&1
```

## Logs

Check `scraper.log` for execution history, or query the `scraper_logs` table:

```sql
SELECT * FROM scraper_logs ORDER BY run_started_at DESC LIMIT 10;
```

