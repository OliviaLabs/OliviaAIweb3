/**
 * Protokols API Service
 * Provides real-time X/on-chain data and KOL insights
 * API Documentation: https://api.protokols.io/
 */

import { config } from '../config/config.js';

class ProtokolsService {
  constructor() {
    this.baseUrl = 'https://public-api.protokols.io/api/v1';
    this.apiKey = process.env.PROTOKOLS_API_KEY;
    this.rateLimit = {
      requests: 0,
      resetTime: Date.now() + 60000, // 1 minute
      maxRequests: 100 // Based on starter plan
    };
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return this.apiKey && this.apiKey !== 'your_protokols_api_key_here';
  }

  /**
   * Make authenticated request to Protokols API
   */
  async makeRequest(endpoint, params = {}) {
    if (!this.isConfigured()) {
      throw new Error('Protokols API key not configured');
    }

    // Simple rate limiting
    if (this.rateLimit.requests >= this.rateLimit.maxRequests) {
      const now = Date.now();
      if (now < this.rateLimit.resetTime) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      this.rateLimit.requests = 0;
      this.rateLimit.resetTime = now + 60000;
    }

    this.rateLimit.requests++;

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Olivia-AI-Web3/1.0'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Protokols API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Protokols API request failed:', error);
      throw error;
    }
  }

  /**
   * Get trending KOLs by various metrics
   * GET /trending/kol/views, /trending/kol/smart-followers, /trending/kol/smart-engagement
   */
  async getTrendingKOLs(params = {}) {
    try {
      const metric = params.metric || 'views'; // views, smart-followers, smart-engagement
      const data = await this.makeRequest(`/trending/kol/${metric}`, {
        limit: params.limit || 10,
        timeframe: params.timeframe || '7d'
      });

      return {
        success: true,
        data: {
          kols: data.data || data,
          total: data.total || data.data?.length || 0,
          metric,
          timeframe: params.timeframe || '7d'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * List narratives
   * GET /narratives
   */
  async getNarratives(params = {}) {
    try {
      const data = await this.makeRequest('/narratives', {
        limit: params.limit || 10,
        cursor: params.cursor,
        sort_by: params.sort_by || 'market_cap',
        sort_order: params.sort_order || 'desc'
      });

      return {
        success: true,
        data: {
          narratives: data.data || data,
          pagination: data.pagination || null,
          total: data.total || data.data?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get narrative details
   * GET /narratives/{narrative_id}
   */
  async getNarrativeDetails(narrativeId) {
    try {
      const data = await this.makeRequest(`/narratives/${narrativeId}`);

      return {
        success: true,
        data: {
          narrative: data.data || data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get KOL profile by username
   * GET /twitter/profiles/{username}
   */
  async getKOLProfile(username) {
    try {
      if (!username) {
        throw new Error('Username parameter is required');
      }

      const data = await this.makeRequest(`/twitter/profiles/${username}`);

      return {
        success: true,
        data: {
          profile: data.data || data,
          username
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get KOL token mentions
   * GET /kol/token-mentions
   */
  async getKOLTokenMentions(params = {}) {
    try {
      const data = await this.makeRequest('/kol/token-mentions', {
        limit: params.limit || 20,
        cursor: params.cursor,
        kol_id: params.kol_id,
        token_address: params.token_address
      });

      return {
        success: true,
        data: {
          mentions: data.data || data,
          pagination: data.pagination || null,
          total: data.total || data.data?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get trending projects by views
   * GET /trending/projects/views
   */
  async getTrendingProjects(params = {}) {
    try {
      const metric = params.metric || 'views'; // views, smart-followers, smart-engagement
      const data = await this.makeRequest(`/trending/projects/${metric}`, {
        limit: params.limit || 10,
        timeframe: params.timeframe || '7d'
      });

      return {
        success: true,
        data: {
          projects: data.data || data,
          total: data.total || data.data?.length || 0,
          metric,
          timeframe: params.timeframe || '7d'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Search posts
   * GET /posts/search
   */
  async searchPosts(params = {}) {
    try {
      const data = await this.makeRequest('/posts/search', {
        query: params.query,
        limit: params.limit || 20,
        cursor: params.cursor,
        user_mentions: params.user_mentions,
        token_mentions: params.token_mentions,
        from_date: params.from_date,
        to_date: params.to_date
      });

      return {
        success: true,
        data: {
          posts: data.data || data,
          pagination: data.pagination || null,
          total: data.total || data.data?.length || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get comprehensive crypto social analysis
   * Combines multiple endpoints for a complete picture
   */
  async getCryptoSocialAnalysis(params = {}) {
    try {
      const { query, timeframe = '7d' } = params;
      
      const [narratives, trendingKOLs, trendingProjects, posts] = await Promise.allSettled([
        this.getNarratives({ limit: 5 }),
        this.getTrendingKOLs({ metric: 'views', limit: 5 }),
        this.getTrendingProjects({ metric: 'views', limit: 5 }),
        query ? this.searchPosts({ query, limit: 10 }) : Promise.resolve({ success: true, data: { posts: [] } })
      ]);

      const analysis = {
        success: true,
        data: {
          timeframe,
          narratives: narratives.status === 'fulfilled' ? narratives.value : null,
          trendingKOLs: trendingKOLs.status === 'fulfilled' ? trendingKOLs.value : null,
          trendingProjects: trendingProjects.status === 'fulfilled' ? trendingProjects.value : null,
          posts: posts.status === 'fulfilled' ? posts.value : null,
          timestamp: new Date().toISOString()
        }
      };

      return analysis;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

export default new ProtokolsService();
