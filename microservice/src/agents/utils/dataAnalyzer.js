/**
 * Data Analyzer Utility
 * Analyzes relationships between different data sources for comprehensive insights
 */
export class DataAnalyzer {
  
  /**
   * Analyze data relationships across multiple sources
   * @param {object} allData - All available data from APIs and plugins
   * @param {object} understanding - User understanding from Reasoning Agent
   * @returns {object} Comprehensive data analysis
   */
  static analyzeDataRelationships(allData, understanding) {
    console.log('🔍 [Data Analyzer] Analyzing data relationships across sources...');
    
    const analysis = {
      dataSources: Object.keys(allData).length,
      insights: [],
      correlations: [],
      patterns: [],
      comprehensiveSummary: ''
    };
    
    // Analyze price data correlations
    if (allData.priceData && allData.trendingData) {
      analysis.correlations.push({
        type: 'price-trending',
        description: 'Price data correlates with trending information',
        strength: 'high'
      });
    }
    
    // Analyze sentiment correlations
    if (allData.sentimentData && allData.newsData) {
      analysis.correlations.push({
        type: 'sentiment-news',
        description: 'Social sentiment correlates with news sentiment',
        strength: 'medium'
      });
    }
    
    // Analyze volume patterns
    if (allData.volumeData && allData.priceData) {
      analysis.patterns.push({
        type: 'volume-price',
        description: 'Volume spikes often precede price movements',
        strength: 'high'
      });
    }
    
    // Generate comprehensive insights
    analysis.insights = this.generateInsights(allData, understanding);
    
    // Create comprehensive summary
    analysis.comprehensiveSummary = this.createComprehensiveSummary(allData, analysis);
    
    console.log(`🔍 [Data Analyzer] Found ${analysis.insights.length} insights, ${analysis.correlations.length} correlations, ${analysis.patterns.length} patterns`);
    
    return analysis;
  }
  
  /**
   * Generate insights from available data
   * @param {object} allData - All available data
   * @param {object} understanding - User understanding
   * @returns {Array} Array of insights
   */
  static generateInsights(allData, understanding) {
    const insights = [];
    
    // Price insights
    if (allData.priceData) {
      insights.push('Real-time price data available for accurate current values');
    }
    
    // Trending insights
    if (allData.trendingData) {
      insights.push('Trending data shows current market momentum and popular tokens');
    }
    
    // Sentiment insights
    if (allData.sentimentData) {
      insights.push('Social sentiment data provides community mood and sentiment analysis');
    }
    
    // Volume insights
    if (allData.volumeData) {
      insights.push('Volume data indicates trading activity and market interest');
    }
    
    // News insights
    if (allData.newsData) {
      insights.push('News data provides fundamental analysis and market context');
    }
    
    // KOL insights
    if (allData.kolsData) {
      insights.push('KOL data shows influencer opinions and expert analysis');
    }
    
    return insights;
  }
  
  /**
   * Create comprehensive summary of all data
   * @param {object} allData - All available data
   * @param {object} analysis - Analysis results
   * @returns {string} Comprehensive summary
   */
  static createComprehensiveSummary(allData, analysis) {
    let summary = `Comprehensive Analysis Summary:\n\n`;
    summary += `Data Sources: ${analysis.dataSources}\n`;
    summary += `Insights: ${analysis.insights.length}\n`;
    summary += `Correlations: ${analysis.correlations.length}\n`;
    summary += `Patterns: ${analysis.patterns.length}\n\n`;
    
    summary += `Available Data Types:\n`;
    Object.keys(allData).forEach(key => {
      summary += `- ${key}: ${typeof allData[key] === 'object' ? Object.keys(allData[key]).length + ' items' : 'available'}\n`;
    });
    
    summary += `\nKey Insights:\n`;
    analysis.insights.forEach((insight, index) => {
      summary += `${index + 1}. ${insight}\n`;
    });
    
    return summary;
  }
  
  /**
   * Find data patterns across sources
   * @param {object} allData - All available data
   * @returns {Array} Array of patterns
   */
  static findPatterns(allData) {
    const patterns = [];
    
    // Look for common tokens across different data sources
    const tokenSets = {};
    Object.entries(allData).forEach(([source, data]) => {
      if (data && typeof data === 'object') {
        // Extract tokens from different data structures
        const tokens = this.extractTokens(data);
        tokens.forEach(token => {
          if (!tokenSets[token]) tokenSets[token] = [];
          tokenSets[token].push(source);
        });
      }
    });
    
    // Find tokens that appear in multiple sources
    Object.entries(tokenSets).forEach(([token, sources]) => {
      if (sources.length > 1) {
        patterns.push({
          type: 'cross-source-token',
          token,
          sources,
          strength: sources.length
        });
      }
    });
    
    return patterns;
  }
  
  /**
   * Extract tokens from data structures
   * @param {object} data - Data object
   * @returns {Array} Array of tokens
   */
  static extractTokens(data) {
    const tokens = [];
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.symbol) tokens.push(item.symbol);
        if (item.name) tokens.push(item.name);
        if (item.id) tokens.push(item.id);
      });
    } else if (typeof data === 'object') {
      Object.values(data).forEach(value => {
        if (typeof value === 'object') {
          tokens.push(...this.extractTokens(value));
        }
      });
    }
    
    return [...new Set(tokens)]; // Remove duplicates
  }
}
