/**
 * Protokols API Service
 * Provides KOL insights and social data
 */

import { OPENAI_MICROSERVICE_CONFIG } from '../config/endpoints';

class ProtokolsService {
  constructor() {
    this.baseUrl = `${OPENAI_MICROSERVICE_CONFIG.URL}/api/protokols`;
  }

  /**
   * Make authenticated request to Protokols API
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Protokols API request failed:', error);
      throw error;
    }
  }

  /**
   * Get trending KOLs
   */
  async getTrendingKOLs(params = {}) {
    const queryParams = new URLSearchParams({
      limit: params.limit || 10,
      metric: params.metric || 'views',
      timeframe: params.timeframe || '7d'
    });

    return this.makeRequest(`/kol/trending?${queryParams}`);
  }

  /**
   * Get narratives
   */
  async getNarratives(params = {}) {
    const queryParams = new URLSearchParams({
      limit: params.limit || 10,
      sort_by: params.sort_by || 'market_cap',
      sort_order: params.sort_order || 'desc'
    });

    if (params.cursor) queryParams.append('cursor', params.cursor);

    return this.makeRequest(`/narratives?${queryParams}`);
  }

  /**
   * Get KOL profile
   */
  async getKOLProfile(username) {
    return this.makeRequest(`/profile/${username}`);
  }

  /**
   * Get trending projects
   */
  async getTrendingProjects(params = {}) {
    const queryParams = new URLSearchParams({
      limit: params.limit || 10,
      metric: params.metric || 'views',
      timeframe: params.timeframe || '7d'
    });

    return this.makeRequest(`/projects/trending?${queryParams}`);
  }

  /**
   * Search posts
   */
  async searchPosts(params = {}) {
    const queryParams = new URLSearchParams({
      query: params.query,
      limit: params.limit || 20
    });

    if (params.cursor) queryParams.append('cursor', params.cursor);
    if (params.user_mentions) queryParams.append('user_mentions', params.user_mentions);
    if (params.token_mentions) queryParams.append('token_mentions', params.token_mentions);
    if (params.from_date) queryParams.append('from_date', params.from_date);
    if (params.to_date) queryParams.append('to_date', params.to_date);

    return this.makeRequest(`/posts/search?${queryParams}`);
  }

  /**
   * Get comprehensive crypto social analysis
   */
  async getCryptoSocialAnalysis(params = {}) {
    const queryParams = new URLSearchParams({
      timeframe: params.timeframe || '7d'
    });

    if (params.query) queryParams.append('query', params.query);

    return this.makeRequest(`/analysis?${queryParams}`);
  }

  /**
   * Check service status
   */
  async getStatus() {
    return this.makeRequest('/status');
  }
}

export default new ProtokolsService();
