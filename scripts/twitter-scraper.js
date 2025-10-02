/**
 * Twitter Token Scraper - Uses existing RapidAPI Twitter service
 * Searches for token mentions and saves to JSON
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your existing RapidAPI key
const RAPIDAPI_KEY = 'f96f96fff6msh857435ff96d630ap1eadcdjsn1908e20abe18';

// Tokens to search for
const TOKENS = [
  'BTC', 'ETH', 'SOL', 'DOGE', 'PEPE', 'SUI', 'TON', 
  'ARB', 'OP', 'AVAX', 'SEI', 'ENA', 'WIF', 'MATIC',
  'LINK', 'UNI', 'AAVE', 'CRV', 'LDO', 'APT'
];

// Search Twitter using RapidAPI
async function searchTwitter(query) {
  try {
    console.log(`🐦 Searching: "${query}"`);
    
    const response = await fetch(
      `https://twitter-api45.p.rapidapi.com/search.php?query=${encodeURIComponent(query)}&search_type=Latest`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'twitter-api45.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const tweets = data.timeline || data.tweets || [];
    
    console.log(`   ✓ Found ${tweets.length} tweets`);
    return tweets;
    
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`);
    return [];
  }
}

// Extract unique speakers from tweets
function extractSpeakers(tweets) {
  const speakers = new Set();
  tweets.forEach(tweet => {
    const username = tweet.user?.screen_name || 
                    tweet.author?.username || 
                    tweet.screen_name ||
                    tweet.user_info?.screen_name;
    if (username) speakers.add(username);
  });
  return Array.from(speakers);
}

// Main scraper function
async function scrapeTokens() {
  console.log('🚀 Starting Twitter Token Scraper');
  console.log('=' .repeat(50));
  console.log(`📊 Scanning ${TOKENS.length} tokens\n`);

  const results = [];

  for (const token of TOKENS) {
    const query = `$${token} -filter:retweets`; // Search for $TOKEN, exclude retweets
    const tweets = await searchTwitter(query);
    const speakers = extractSpeakers(tweets);
    
    results.push({
      name: token,
      value: tweets.length,
      speakers: speakers.length
    });

    // Rate limiting - be nice to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Sort by mentions (most to least)
  results.sort((a, b) => b.value - a.value);

  // Create output
  const output = {
    lastUpdated: new Date().toISOString(),
    tokens: results.filter(r => r.value > 0) // Only include tokens with mentions
  };

  // Save to public folder
  const publicPath = path.join(__dirname, '../public/data/bubble-data.json');
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));

  // Also save to microservice folder
  const microservicePath = path.join(__dirname, '../microservice/data/bubble-data.json');
  fs.mkdirSync(path.dirname(microservicePath), { recursive: true });
  fs.writeFileSync(microservicePath, JSON.stringify(output, null, 2));

  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('✅ Scraping complete!');
  console.log(`   Tokens with mentions: ${output.tokens.length}`);
  console.log('\n   Top 10:');
  output.tokens.slice(0, 10).forEach((token, idx) => {
    console.log(`   ${idx + 1}. $${token.name}: ${token.value} tweets from ${token.speakers} speakers`);
  });
  console.log('\n   📁 Saved to:');
  console.log(`      - ${publicPath}`);
  console.log(`      - ${microservicePath}`);
  console.log('='.repeat(50));
}

// Run scraper
scrapeTokens().catch(console.error);

