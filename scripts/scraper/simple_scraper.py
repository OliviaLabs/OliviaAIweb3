#!/usr/bin/env python3
"""
Simple Token Scraper - Saves to JSON (no database needed)
"""

import json
import re
import subprocess
import time
from datetime import datetime, timedelta
from collections import defaultdict

# Configuration
HOURS_BACK = 24
TWEETS_PER_INFLUENCER = 30
DELAY = 0.5

# Influencers to scrape
INFLUENCERS = [
    "CryptoMichNL",
    "TheCryptoDog", 
    "CryptoTony__",
    "CryptoDonAlt",
    "rektcapital",
    "AltcoinSherpa",
    "Pentoshi",
    "WClementeIII"
]

def extract_tokens(text):
    """Extract $TOKEN symbols"""
    pattern = r'\$([A-Z0-9]{2,10})(?![A-Z0-9])'
    matches = re.findall(pattern, text.upper())
    false_positives = {'USD', 'US', 'UK', 'USA', 'EUR', 'GBP'}
    return [t for t in set(matches) if t not in false_positives]

def scrape_influencer(handle, since_date):
    """Scrape tweets from handle"""
    print(f"  📥 Scraping @{handle}...")
    
    query = f"from:{handle} since:{since_date}"
    cmd = ["snscrape", "--jsonl", f"--max-results={TWEETS_PER_INFLUENCER}", "twitter-search", query]
    
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        tweets = []
        
        for line in proc.stdout.splitlines():
            try:
                data = json.loads(line)
                tweets.append({
                    'text': data.get('renderedContent') or data.get('rawContent', ''),
                    'likes': data.get('likeCount', 0),
                    'retweets': data.get('retweetCount', 0),
                    'replies': data.get('replyCount', 0),
                    'date': data.get('date')
                })
            except:
                continue
        
        print(f"    ✓ Found {len(tweets)} tweets")
        return tweets
    except Exception as e:
        print(f"    ⚠️  Error: {e}")
        return []

def main():
    print("🚀 Starting Simple Token Scraper")
    print("=" * 50)
    
    since_date = (datetime.utcnow() - timedelta(hours=HOURS_BACK)).strftime('%Y-%m-%d')
    
    # Collect mentions
    token_mentions = defaultdict(lambda: {"count": 0, "speakers": []})
    
    for idx, handle in enumerate(INFLUENCERS, 1):
        print(f"[{idx}/{len(INFLUENCERS)}] @{handle}")
        
        tweets = scrape_influencer(handle, since_date)
        
        for tweet in tweets:
            tokens = extract_tokens(tweet['text'])
            for token in tokens:
                token_mentions[token]["count"] += 1
                if handle not in token_mentions[token]["speakers"]:
                    token_mentions[token]["speakers"].append(handle)
        
        time.sleep(DELAY)
    
    # Format for bubble map
    bubble_data = [
        {
            "name": token,
            "value": data["count"],
            "speakers": len(data["speakers"])
        }
        for token, data in token_mentions.items()
    ]
    
    # Sort by mentions
    bubble_data.sort(key=lambda x: x["value"], reverse=True)
    
    # Save to JSON
    output = {
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "tokens": bubble_data
    }
    
    # Save to microservice/data
    with open("../../microservice/data/bubble-data.json", "w") as f:
        json.dump(output, f, indent=2)
    
    # Also save to public folder for frontend access
    with open("../../public/data/bubble-data.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print("\n" + "=" * 50)
    print("✅ Scraping complete!")
    print(f"   Tokens found: {len(bubble_data)}")
    print(f"   Top 5:")
    for token in bubble_data[:5]:
        print(f"     ${token['name']}: {token['value']} mentions")
    print(f"\n   Saved to: microservice/data/bubble-data.json")
    print("=" * 50)

if __name__ == "__main__":
    main()

