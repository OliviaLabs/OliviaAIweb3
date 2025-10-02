-- Olivia AI Explore Feature Database Schema
-- PostgreSQL

-- ========================================
-- 1. TRACKED INFLUENCERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS tracked_influencers (
    id SERIAL PRIMARY KEY,
    twitter_handle VARCHAR(255) UNIQUE NOT NULL,
    twitter_name VARCHAR(255),
    profile_image_url TEXT,
    followers_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    whitelisted BOOLEAN DEFAULT FALSE,
    added_by_user_id VARCHAR(255),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_scraped_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, pending_review, removed
    votes_count INTEGER DEFAULT 0,
    bio TEXT,
    twitter_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tracked_influencers
CREATE INDEX idx_tracked_influencers_handle ON tracked_influencers(twitter_handle);
CREATE INDEX idx_tracked_influencers_status ON tracked_influencers(status);
CREATE INDEX idx_tracked_influencers_whitelisted ON tracked_influencers(whitelisted);

-- ========================================
-- 2. TOKENS METADATA TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS tokens_metadata (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) UNIQUE NOT NULL, -- BTC, ETH, SOL
    name VARCHAR(255), -- Bitcoin, Ethereum
    icon_url TEXT,
    coingecko_id VARCHAR(255),
    force_show BOOLEAN DEFAULT FALSE,
    total_mentions_24h INTEGER DEFAULT 0,
    total_mentions_7d INTEGER DEFAULT 0,
    trending_score DECIMAL(10, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for tokens_metadata
CREATE INDEX idx_tokens_symbol ON tokens_metadata(symbol);
CREATE INDEX idx_tokens_trending_score ON tokens_metadata(trending_score DESC);

-- ========================================
-- 3. TOKEN MENTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS token_mentions (
    id SERIAL PRIMARY KEY,
    influencer_id INTEGER REFERENCES tracked_influencers(id) ON DELETE CASCADE,
    token_symbol VARCHAR(50) NOT NULL,
    tweet_id VARCHAR(255) UNIQUE NOT NULL,
    tweet_text TEXT,
    tweet_url TEXT,
    posted_at TIMESTAMP NOT NULL,
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    quotes_count INTEGER DEFAULT 0,
    engagement_score DECIMAL(10, 2) DEFAULT 0,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for token_mentions
CREATE INDEX idx_token_mentions_influencer ON token_mentions(influencer_id);
CREATE INDEX idx_token_mentions_symbol ON token_mentions(token_symbol);
CREATE INDEX idx_token_mentions_posted_at ON token_mentions(posted_at DESC);
CREATE INDEX idx_token_mentions_engagement ON token_mentions(engagement_score DESC);
CREATE INDEX idx_token_mentions_tweet_id ON token_mentions(tweet_id);

-- ========================================
-- 4. USER SUBMISSIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_submissions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    twitter_handle VARCHAR(255) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by_admin_id VARCHAR(255),
    rejection_reason TEXT,
    upvotes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_submissions
CREATE INDEX idx_user_submissions_status ON user_submissions(status);
CREATE INDEX idx_user_submissions_user_id ON user_submissions(user_id);
CREATE INDEX idx_user_submissions_handle ON user_submissions(twitter_handle);

-- ========================================
-- 5. MENTION AGGREGATIONS TABLE (for fast queries)
-- ========================================
CREATE TABLE IF NOT EXISTS mention_aggregations (
    id SERIAL PRIMARY KEY,
    token_symbol VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    total_mentions INTEGER DEFAULT 0,
    unique_speakers INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    top_speakers JSONB, -- Array of top speakers
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token_symbol, date)
);

-- Indexes for mention_aggregations
CREATE INDEX idx_mention_agg_symbol ON mention_aggregations(token_symbol);
CREATE INDEX idx_mention_agg_date ON mention_aggregations(date DESC);

-- ========================================
-- 6. SCRAPER LOGS TABLE (optional but useful)
-- ========================================
CREATE TABLE IF NOT EXISTS scraper_logs (
    id SERIAL PRIMARY KEY,
    run_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    run_ended_at TIMESTAMP,
    influencers_scraped INTEGER DEFAULT 0,
    mentions_found INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'running', -- running, completed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tracked_influencers
CREATE TRIGGER update_tracked_influencers_updated_at 
    BEFORE UPDATE ON tracked_influencers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SEED DATA - Initial Whitelisted Influencers
-- ========================================
INSERT INTO tracked_influencers (
    twitter_handle, twitter_name, whitelisted, status, verified
) VALUES
    ('CryptoMichNL', 'Crypto Michaël', true, 'active', true),
    ('TheCryptoDog', 'The Crypto Dog', true, 'active', true),
    ('CryptoTony__', 'Crypto Tony', true, 'active', true),
    ('CryptoDonAlt', 'DonAlt', true, 'active', true),
    ('rektcapital', 'Rekt Capital', true, 'active', true),
    ('Nebraskangooner', 'Nebraskangooner', true, 'active', true),
    ('DaanCrypto', 'Daan Crypto Trades', true, 'active', true),
    ('WendyO', 'Wendy O', true, 'active', true),
    ('WClementeIII', 'Will Clemente', true, 'active', true),
    ('Pentoshi', 'Pentoshi', true, 'active', true),
    ('SalsaTekila', 'SalsaTekila', true, 'active', true),
    ('tradingtank', 'Trading Tank', true, 'active', true),
    ('ilCapoOfCrypto', 'il Capo Of Crypto', true, 'active', true),
    ('AltcoinSherpa', 'Altcoin Sherpa', true, 'active', true),
    ('Roman_Trading', 'Roman', true, 'active', true),
    ('KoroushAK', 'Koroush AK', true, 'active', true),
    ('SatoshiFlipper', 'Satoshi Flipper', true, 'active', true),
    ('TheFlowHorse', 'The Flow Horse', true, 'active', true),
    ('SmartContracter', 'Smart Contracter', true, 'active', true),
    ('TraderSZ', 'TraderSZ', true, 'active', true)
ON CONFLICT (twitter_handle) DO NOTHING;

-- Seed initial tokens
INSERT INTO tokens_metadata (symbol, name, force_show) VALUES
    ('BTC', 'Bitcoin', true),
    ('ETH', 'Ethereum', true),
    ('SOL', 'Solana', true),
    ('SUI', 'Sui', true),
    ('PEPE', 'Pepe', true),
    ('DOGE', 'Dogecoin', true),
    ('TON', 'Toncoin', true),
    ('ARB', 'Arbitrum', true),
    ('OP', 'Optimism', true),
    ('AVAX', 'Avalanche', true),
    ('SEI', 'Sei', true),
    ('ENA', 'Ethena', true),
    ('WIF', 'dogwifhat', true)
ON CONFLICT (symbol) DO NOTHING;

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View: Recent mentions (last 24h)
CREATE OR REPLACE VIEW recent_mentions_24h AS
SELECT 
    tm.token_symbol,
    ti.twitter_handle,
    ti.twitter_name,
    ti.whitelisted,
    ti.verified,
    COUNT(*) as mentions,
    AVG(tm.engagement_score) as avg_engagement,
    SUM(tm.likes_count) as total_likes,
    SUM(tm.retweets_count) as total_retweets
FROM token_mentions tm
JOIN tracked_influencers ti ON tm.influencer_id = ti.id
WHERE tm.posted_at >= NOW() - INTERVAL '24 hours'
GROUP BY tm.token_symbol, ti.id, ti.twitter_handle, ti.twitter_name, ti.whitelisted, ti.verified;

-- View: Token speaker rankings
CREATE OR REPLACE VIEW token_speaker_rankings AS
SELECT 
    tm.token_symbol,
    ti.id as influencer_id,
    ti.twitter_handle,
    ti.twitter_name,
    ti.profile_image_url,
    ti.followers_count,
    ti.verified,
    ti.whitelisted,
    COUNT(*) as tweets,
    AVG(tm.likes_count) as avg_likes,
    AVG(tm.retweets_count) as avg_retweets,
    AVG(tm.replies_count) as avg_replies,
    AVG(tm.engagement_score) as avg_engagement,
    SUM(tm.engagement_score) as total_engagement,
    (COUNT(*) * LOG(1 + ti.followers_count) * (1 + CASE WHEN ti.verified THEN 0.5 ELSE 0 END)) as speaker_score
FROM token_mentions tm
JOIN tracked_influencers ti ON tm.influencer_id = ti.id
WHERE tm.posted_at >= NOW() - INTERVAL '24 hours'
GROUP BY tm.token_symbol, ti.id, ti.twitter_handle, ti.twitter_name, 
         ti.profile_image_url, ti.followers_count, ti.verified, ti.whitelisted
ORDER BY speaker_score DESC;

-- View: Trending tokens
CREATE OR REPLACE VIEW trending_tokens AS
SELECT 
    tm.token_symbol,
    COUNT(DISTINCT tm.influencer_id) as unique_speakers,
    COUNT(*) as total_mentions,
    SUM(tm.engagement_score) as total_engagement,
    AVG(tm.engagement_score) as avg_engagement
FROM token_mentions tm
WHERE tm.posted_at >= NOW() - INTERVAL '24 hours'
GROUP BY tm.token_symbol
ORDER BY total_mentions DESC, total_engagement DESC;

-- Success message
SELECT '✅ Database schema created successfully!' as status;

