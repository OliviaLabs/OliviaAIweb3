import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_MICROSERVICE_URL || 'http://localhost:3001/api';

/**
 * Explore API Service - For Explore page only
 */
class ExploreService {
  /**
   * Get bubble map data (token mentions)
   */
  async getBubbleData() {
    try {
      const response = await axios.get(`${API_BASE_URL}/explore/bubble-data`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching bubble data:', error);
      throw error;
    }
  }

  /**
   * Get who's talking about a specific token
   * @param {string} symbol - Token symbol (e.g., 'BTC', 'ETH')
   * @param {number} limit - Max speakers to return
   */
  async getTokenSpeakers(symbol, limit = 30) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/explore/token-speakers/${symbol}`,
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching speakers for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Submit a new influencer to track
   * @param {string} twitterHandle - Twitter handle (with or without @)
   * @param {string} userId - Current user ID
   * @param {string} reason - Why track this influencer
   */
  async submitInfluencer(twitterHandle, userId, reason = '') {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/explore/submit-influencer`,
        {
          twitter_handle: twitterHandle,
          user_id: userId,
          reason
        },
        {
          headers: {
            'x-admin-secret': import.meta.env.VITE_ADMIN_ACCESS_SECRET
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting influencer:', error);
      throw error;
    }
  }

  /**
   * Get all tracked influencers
   */
  async getTrackedInfluencers(limit = 100) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/explore/tracked-influencers`,
        { params: { limit } }
      );
      return response.data.influencers;
    } catch (error) {
      console.error('Error fetching tracked influencers:', error);
      throw error;
    }
  }

  /**
   * Get user's submissions
   * @param {string} userId - User ID
   */
  async getUserSubmissions(userId) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/explore/user-submissions/${userId}`,
        {
          headers: {
            'x-admin-secret': import.meta.env.VITE_ADMIN_ACCESS_SECRET
          }
        }
      );
      return response.data.submissions;
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      throw error;
    }
  }
}

export const exploreService = new ExploreService();

