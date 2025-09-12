/**
 * Protokols Controller
 * Handles API endpoints for KOL insights and social data
 */

import protokolsService from '../services/protokolsService.js';

class ProtokolsController {
  
  /**
   * Get trending KOLs
   * GET /api/protokols/kol/trending
   */
  static async getTrendingKOLs(req, res) {
    try {
      const { limit = 10, metric = 'views', timeframe = '7d' } = req.query;
      
      const result = await protokolsService.getTrendingKOLs({
        limit: parseInt(limit),
        metric,
        timeframe
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Found ${result.data.total} trending KOLs by ${metric}`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch trending KOLs'
        });
      }
    } catch (error) {
      console.error('Error fetching trending KOLs:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get narratives
   * GET /api/protokols/narratives
   */
  static async getNarratives(req, res) {
    try {
      const { limit = 10, timeframe = '7d', category } = req.query;
      
      const result = await protokolsService.getNarratives({
        limit: parseInt(limit),
        timeframe,
        category
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Found ${result.data.total} narratives for ${timeframe}`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch narratives'
        });
      }
    } catch (error) {
      console.error('Error fetching narratives:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get KOL profile
   * GET /api/protokols/profile/{username}
   */
  static async getKOLProfile(req, res) {
    try {
      const { username } = req.params;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          error: 'Username parameter is required',
          message: 'Please provide a username to fetch profile for'
        });
      }

      const result = await protokolsService.getKOLProfile(username);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Found profile for @${username}`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch KOL profile'
        });
      }
    } catch (error) {
      console.error('Error fetching KOL profile:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get trending projects
   * GET /api/protokols/projects/trending
   */
  static async getTrendingProjects(req, res) {
    try {
      const { limit = 10, metric = 'views', timeframe = '7d' } = req.query;
      
      const result = await protokolsService.getTrendingProjects({
        limit: parseInt(limit),
        metric,
        timeframe
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Found ${result.data.total} trending projects by ${metric}`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch trending projects'
        });
      }
    } catch (error) {
      console.error('Error fetching trending projects:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Search posts
   * GET /api/protokols/posts/search
   */
  static async searchPosts(req, res) {
    try {
      const { query, limit = 20, cursor, user_mentions, token_mentions, from_date, to_date } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required',
          message: 'Please provide a search query'
        });
      }

      const result = await protokolsService.searchPosts({
        query,
        limit: parseInt(limit),
        cursor,
        user_mentions,
        token_mentions,
        from_date,
        to_date
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Found ${result.data.total} posts for "${query}"`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to search posts'
        });
      }
    } catch (error) {
      console.error('Error searching posts:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get comprehensive crypto social analysis
   * GET /api/protokols/analysis
   */
  static async getCryptoSocialAnalysis(req, res) {
    try {
      const { token, keyword, timeframe = '7d' } = req.query;
      
      const result = await protokolsService.getCryptoSocialAnalysis({
        token,
        keyword,
        timeframe
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Comprehensive crypto social analysis completed'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to perform social analysis'
        });
      }
    } catch (error) {
      console.error('Error performing social analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Check Protokols service status
   * GET /api/protokols/status
   */
  static async getStatus(req, res) {
    try {
      const isConfigured = protokolsService.isConfigured();
      
      res.json({
        success: true,
        data: {
          configured: isConfigured,
          service: 'Protokols API',
          endpoints: [
            'GET /api/protokols/kol/top - Top KOLs by reach/influence',
            'GET /api/protokols/narratives - Top narratives and trends',
            'GET /api/protokols/mentioned - Account mentions',
            'GET /api/protokols/mindshare - Keyword mindshare analysis',
            'GET /api/protokols/tokens - Token promotion tracking',
            'GET /api/protokols/analysis - Comprehensive social analysis'
          ]
        },
        message: isConfigured ? 'Protokols API is configured and ready' : 'Protokols API key not configured'
      });
    } catch (error) {
      console.error('Error checking Protokols status:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Internal server error'
      });
    }
  }
}

export default ProtokolsController;
