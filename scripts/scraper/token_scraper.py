#!/usr/bin/env python3
"""
Olivia AI Token Mentions Scraper
Scrapes Twitter for token mentions from tracked influencers
"""

import os
import sys
import re
import time
import json
import subprocess
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
HOURS_BACK = 24
TWEETS_PER_INFLUENCER = 50
DELAY_BETWEEN_SCRAPES = 0.5  # seconds

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        sys.exit(1)

def extract_token_symbols(text: str) -> List[str]:
    """Extract $TOKEN symbols from tweet text"""
    # Pattern: $ followed by 2-10 uppercase letters/numbers
    pattern = r'\$([A-Z0-9]{2,10})(?![A-Z0-9])'
    matches = re.findall(pattern, text.upper())
    
    # Filter out common false positives
    false_positives = {'USD', 'US', 'UK', 'USA', 'EUR', 'GBP', 'CAD', 'AUD'}
    return [symbol for symbol in set(matches) if symbol not in false_positives]

def scrape_influencer_tweets(handle: str, since_date: str) -> List[Dict]:
    """Scrape tweets from a specific influencer using snscrape"""
    print(f"  📥 Scraping @{handle}...")
    
    # Build snscrape command
    query = f"from:{handle} since:{since_date}"
    cmd = [
        "snscrape",
        "--jsonl",
        f"--max-results={TWEETS_PER_INFLUENCER}",
        "twitter-search",
        query
    ]
    
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
        tweets = []
        
        for line in proc.stdout.splitlines():
            try:
                tweet_data = json.loads(line)
                tweets.append({
                    'tweet_id': tweet_data.get('id_str') or str(tweet_data.get('id')),
                    'text': tweet_data.get('renderedContent') or tweet_data.get('rawContent') or tweet_data.get('content', ''),
                    'posted_at': tweet_data.get('date'),
                    'likes': tweet_data.get('likeCount', 0),
                    'retweets': tweet_data.get('retweetCount', 0),
                    'replies': tweet_data.get('replyCount', 0),
                    'quotes': tweet_data.get('quoteCount', 0),
                    'url': tweet_data.get('url')
                })
            except json.JSONDecodeError:
                continue
        
        print(f"    ✓ Found {len(tweets)} tweets")
        return tweets
        
    except subprocess.TimeoutExpired:
        print(f"    ⚠️  Timeout scraping @{handle}")
        return []
    except subprocess.CalledProcessError as e:
        print(f"    ⚠️  Error scraping @{handle}: {e}")
        return []
    except Exception as e:
        print(f"    ⚠️  Unexpected error for @{handle}: {e}")
        return []

def calculate_engagement_score(likes: int, retweets: int, replies: int, quotes: int) -> float:
    """Calculate engagement score for a tweet"""
    # Weight: likes(1x) + retweets(2x) + replies(1.5x) + quotes(2.5x)
    return likes + (retweets * 2) + (replies * 1.5) + (quotes * 2.5)

def store_mention(conn, influencer_id: int, token_symbol: str, tweet_data: Dict) -> bool:
    """Store a token mention in the database"""
    try:
        cursor = conn.cursor()
        
        engagement_score = calculate_engagement_score(
            tweet_data['likes'],
            tweet_data['retweets'],
            tweet_data['replies'],
            tweet_data['quotes']
        )
        
        query = """
            INSERT INTO token_mentions 
            (influencer_id, token_symbol, tweet_id, tweet_text, tweet_url, 
             posted_at, likes_count, retweets_count, replies_count, quotes_count, engagement_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (tweet_id) 
            DO UPDATE SET
                likes_count = EXCLUDED.likes_count,
                retweets_count = EXCLUDED.retweets_count,
                replies_count = EXCLUDED.replies_count,
                quotes_count = EXCLUDED.quotes_count,
                engagement_score = EXCLUDED.engagement_score,
                scraped_at = CURRENT_TIMESTAMP
        """
        
        cursor.execute(query, (
            influencer_id,
            token_symbol,
            tweet_data['tweet_id'],
            tweet_data['text'],
            tweet_data['url'],
            tweet_data['posted_at'],
            tweet_data['likes'],
            tweet_data['retweets'],
            tweet_data['replies'],
            tweet_data['quotes'],
            engagement_score
        ))
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"      ⚠️  Error storing mention: {e}")
        conn.rollback()
        return False

def update_influencer_last_scraped(conn, influencer_id: int):
    """Update the last_scraped_at timestamp for an influencer"""
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tracked_influencers SET last_scraped_at = CURRENT_TIMESTAMP WHERE id = %s",
            (influencer_id,)
        )
        conn.commit()
    except Exception as e:
        print(f"    ⚠️  Error updating last_scraped_at: {e}")
        conn.rollback()

def update_token_aggregations(conn):
    """Update aggregated stats for tokens"""
    print("\n📊 Updating token aggregations...")
    
    try:
        cursor = conn.cursor()
        
        # Update 24h mention counts
        cursor.execute("""
            UPDATE tokens_metadata tm
            SET 
                total_mentions_24h = (
                    SELECT COUNT(*)
                    FROM token_mentions
                    WHERE token_symbol = tm.symbol
                    AND posted_at >= NOW() - INTERVAL '24 hours'
                ),
                total_mentions_7d = (
                    SELECT COUNT(*)
                    FROM token_mentions
                    WHERE token_symbol = tm.symbol
                    AND posted_at >= NOW() - INTERVAL '7 days'
                ),
                last_updated = CURRENT_TIMESTAMP
        """)
        
        conn.commit()
        print("  ✓ Token aggregations updated")
        
    except Exception as e:
        print(f"  ⚠️  Error updating aggregations: {e}")
        conn.rollback()

def log_scraper_run(conn, run_id: int, influencers_scraped: int, mentions_found: int, errors: int):
    """Log the scraper run results"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE scraper_logs 
            SET 
                run_ended_at = CURRENT_TIMESTAMP,
                influencers_scraped = %s,
                mentions_found = %s,
                errors_count = %s,
                status = 'completed'
            WHERE id = %s
        """, (influencers_scraped, mentions_found, errors, run_id))
        conn.commit()
    except Exception as e:
        print(f"⚠️  Error logging run: {e}")

def main():
    print("🚀 Starting Olivia AI Token Mentions Scraper")
    print(f"⏰ Scanning last {HOURS_BACK} hours")
    print("=" * 50)
    
    # Connect to database
    conn = get_db_connection()
    print("✅ Database connected\n")
    
    # Start scraper log
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scraper_logs (status) 
        VALUES ('running') 
        RETURNING id
    """)
    run_id = cursor.fetchone()['id']
    conn.commit()
    
    # Get active tracked influencers
    cursor.execute("""
        SELECT id, twitter_handle 
        FROM tracked_influencers 
        WHERE status = 'active'
        ORDER BY whitelisted DESC, followers_count DESC
    """)
    influencers = cursor.fetchall()
    
    print(f"👥 Found {len(influencers)} tracked influencers\n")
    
    # Calculate time window
    since_date = (datetime.utcnow() - timedelta(hours=HOURS_BACK)).strftime('%Y-%m-%d')
    
    # Scrape each influencer
    total_mentions = 0
    errors_count = 0
    
    for idx, influencer in enumerate(influencers, 1):
        influencer_id = influencer['id']
        handle = influencer['twitter_handle']
        
        print(f"[{idx}/{len(influencers)}] @{handle}")
        
        try:
            # Scrape tweets
            tweets = scrape_influencer_tweets(handle, since_date)
            
            # Process each tweet for token mentions
            mention_count = 0
            for tweet in tweets:
                token_symbols = extract_token_symbols(tweet['text'])
                
                for symbol in token_symbols:
                    if store_mention(conn, influencer_id, symbol, tweet):
                        mention_count += 1
                        total_mentions += 1
            
            if mention_count > 0:
                print(f"    💎 Stored {mention_count} token mentions")
            
            # Update last scraped timestamp
            update_influencer_last_scraped(conn, influencer_id)
            
            # Be nice - add delay between scrapes
            time.sleep(DELAY_BETWEEN_SCRAPES)
            
        except Exception as e:
            print(f"    ❌ Error processing @{handle}: {e}")
            errors_count += 1
    
    # Update aggregations
    update_token_aggregations(conn)
    
    # Log results
    log_scraper_run(conn, run_id, len(influencers), total_mentions, errors_count)
    
    # Close connection
    conn.close()
    
    # Summary
    print("\n" + "=" * 50)
    print("✅ Scraping completed!")
    print(f"   Influencers scraped: {len(influencers)}")
    print(f"   Token mentions found: {total_mentions}")
    print(f"   Errors: {errors_count}")
    print("=" * 50)

if __name__ == "__main__":
    main()

