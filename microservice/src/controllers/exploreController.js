import { pool } from '../config/database.js';

// ========================================
// GET BUBBLE MAP DATA
// ========================================
export const getBubbleData = async (req, res) => {
  try {
    const query = `
      SELECT 
        token_symbol,
        COUNT(DISTINCT influencer_id) as unique_speakers,
        COUNT(*) as total_mentions,
        SUM(engagement_score) as total_engagement
      FROM token_mentions
      WHERE posted_at >= NOW() - INTERVAL '24 hours'
      GROUP BY token_symbol
      ORDER BY total_mentions DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    
    // Format for bubble map
    const bubbleData = result.rows.map(row => ({
      name: row.token_symbol,
      value: parseInt(row.total_mentions),
      speakers: parseInt(row.unique_speakers),
      engagement: parseFloat(row.total_engagement) || 0
    }));
    
    res.json({
      success: true,
      data: bubbleData,
      count: bubbleData.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching bubble data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bubble data'
    });
  }
};

// ========================================
// GET TOKEN SPEAKERS (who's talking about a token)
// ========================================
export const getTokenSpeakers = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 30 } = req.query;
    
    const query = `
      SELECT 
        ti.id,
        ti.twitter_handle,
        ti.twitter_name,
        ti.profile_image_url,
        ti.followers_count,
        ti.verified,
        ti.whitelisted,
        COUNT(*) as tweets,
        ROUND(AVG(tm.likes_count), 2) as avg_likes,
        ROUND(AVG(tm.retweets_count), 2) as avg_retweets,
        ROUND(AVG(tm.replies_count), 2) as avg_replies,
        ROUND(SUM(tm.engagement_score), 2) as total_engagement,
        ROUND(
          COUNT(*) * LOG(1 + ti.followers_count) * 
          (1 + CASE WHEN ti.verified THEN 0.5 ELSE 0 END)
        , 2) as score
      FROM token_mentions tm
      JOIN tracked_influencers ti ON tm.influencer_id = ti.id
      WHERE tm.token_symbol = $1
        AND tm.posted_at >= NOW() - INTERVAL '24 hours'
        AND ti.status = 'active'
      GROUP BY ti.id
      ORDER BY score DESC, total_engagement DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [symbol.toUpperCase(), limit]);
    
    const speakers = result.rows.map(row => ({
      handle: `@${row.twitter_handle}`,
      name: row.twitter_name,
      avatar: row.profile_image_url,
      verified: row.verified,
      whitelisted: row.whitelisted,
      followers: row.followers_count,
      tweets: parseInt(row.tweets),
      avgLikes: parseFloat(row.avg_likes),
      avgRetweets: parseFloat(row.avg_retweets),
      avgReplies: parseFloat(row.avg_replies),
      totalEngagement: parseFloat(row.total_engagement),
      score: parseFloat(row.score),
      url: `https://x.com/${row.twitter_handle}`
    }));
    
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      speakers,
      count: speakers.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching token speakers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token speakers'
    });
  }
};

// ========================================
// SUBMIT INFLUENCER (user submission)
// ========================================
export const submitInfluencer = async (req, res) => {
  try {
    const { twitter_handle, reason, user_id } = req.body;
    
    if (!twitter_handle || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Twitter handle and user_id are required'
      });
    }
    
    // Clean the handle (remove @ if present)
    const cleanHandle = twitter_handle.replace('@', '');
    
    // Check if already tracked
    const existingCheck = await pool.query(
      'SELECT id FROM tracked_influencers WHERE twitter_handle = $1',
      [cleanHandle]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This influencer is already being tracked'
      });
    }
    
    // Check if already submitted
    const submissionCheck = await pool.query(
      'SELECT id FROM user_submissions WHERE twitter_handle = $1 AND status = $2',
      [cleanHandle, 'pending']
    );
    
    if (submissionCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This influencer has already been submitted and is pending review'
      });
    }
    
    // Insert submission
    const insertQuery = `
      INSERT INTO user_submissions (user_id, twitter_handle, reason, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING id, submitted_at
    `;
    
    const result = await pool.query(insertQuery, [user_id, cleanHandle, reason]);
    
    res.json({
      success: true,
      message: 'Influencer submitted for review',
      submission: {
        id: result.rows[0].id,
        twitter_handle: cleanHandle,
        submitted_at: result.rows[0].submitted_at
      }
    });
    
  } catch (error) {
    console.error('Error submitting influencer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit influencer'
    });
  }
};

// ========================================
// GET TRACKED INFLUENCERS
// ========================================
export const getTrackedInfluencers = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const query = `
      SELECT 
        id,
        twitter_handle,
        twitter_name,
        profile_image_url,
        followers_count,
        verified,
        whitelisted,
        added_at,
        last_scraped_at
      FROM tracked_influencers
      WHERE status = 'active'
      ORDER BY whitelisted DESC, followers_count DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    
    res.json({
      success: true,
      influencers: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching tracked influencers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracked influencers'
    });
  }
};

// ========================================
// GET SUBMISSION STATUS (for user to check their submissions)
// ========================================
export const getUserSubmissions = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const query = `
      SELECT 
        id,
        twitter_handle,
        reason,
        status,
        submitted_at,
        reviewed_at,
        rejection_reason,
        upvotes_count
      FROM user_submissions
      WHERE user_id = $1
      ORDER BY submitted_at DESC
    `;
    
    const result = await pool.query(query, [user_id]);
    
    res.json({
      success: true,
      submissions: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions'
    });
  }
};

