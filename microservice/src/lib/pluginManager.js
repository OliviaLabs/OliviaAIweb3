// Plugin management system for the microservice
// Controls which APIs and tools are available based on enabled plugins

// Plugin to API endpoint mapping
export const PLUGIN_API_MAP = {
  'zerox': {
    routes: ['/api/zerox/*'],
    tools: ['getSwapPrice', 'getSwapQuote', 'executeSwap'],
    description: '0x Protocol DEX aggregator for token swaps'
  },
  'coinstats': {
    routes: ['/api/coinstats/*'],
    tools: ['getCoinData', 'searchCoins', 'getMarketData'],
    description: 'CoinStats API for market data and coin information'
  },
  'changenow': {
    routes: ['/api/changenow/*'],
    tools: ['getExchangeRate', 'createTransaction'],
    description: 'ChangeNOW API for cross-chain swaps'
  },
  'lurky': {
    routes: ['/api/lurky/*'],
    tools: ['getTrendingCoins', 'getCoinInsights'],
    description: 'Lurky API for crypto analytics'
  },
  'okx': {
    routes: ['/api/okx/*'],
    tools: ['getOKXQuote', 'getOKXChains'],
    description: 'OKX DEX API for trading'
  },
  'alchemy': {
    routes: ['/api/alchemy/*'],
    tools: ['getTokenBalances', 'getTransactionHistory'],
    description: 'Alchemy API for blockchain data'
  }
};

// No default plugins - only use what frontend explicitly enables

/**
 * Get enabled plugins from request headers or use defaults
 */
export function getEnabledPlugins(req) {
  try {
    // Check for plugin states in request headers
    const pluginStatesHeader = req.headers['x-plugin-states'];
    if (pluginStatesHeader) {
      const pluginStates = JSON.parse(pluginStatesHeader);
      const enabledPlugins = Object.entries(pluginStates)
        .filter(([_, enabled]) => enabled === true)
        .map(([pluginId, _]) => pluginId);
      
      console.log('🔌 Plugin states from frontend:', enabledPlugins);
      return enabledPlugins;
    }
  } catch (error) {
    console.warn('⚠️ Failed to parse plugin states from header:', error.message);
  }
  
  // NO DEFAULTS - if no plugin states provided, return empty array
  console.log('🔌 No plugin states provided - no plugins enabled');
  return [];
}

/**
 * Check if a plugin is enabled
 */
export function isPluginEnabled(req, pluginId) {
  const enabledPlugins = getEnabledPlugins(req);
  const enabled = enabledPlugins.includes(pluginId);
  console.log(`🔌 Plugin ${pluginId} is ${enabled ? 'ENABLED' : 'DISABLED'}`);
  return enabled;
}

/**
 * Get available tools based on enabled plugins
 */
export function getAvailableTools(req) {
  const enabledPlugins = getEnabledPlugins(req);
  const availableTools = new Set();
  
  for (const pluginId of enabledPlugins) {
    const plugin = PLUGIN_API_MAP[pluginId];
    if (plugin && plugin.tools) {
      plugin.tools.forEach(tool => availableTools.add(tool));
    }
  }
  
  console.log('🛠️ Available tools based on enabled plugins:', Array.from(availableTools));
  return availableTools;
}

/**
 * Middleware to block disabled plugin API calls
 */
export function pluginAccessMiddleware(req, res, next) {
  const fullPath = req.originalUrl.split('?')[0]; // Remove query parameters
  
  // Find which plugin this API belongs to
  let pluginId = null;
  for (const [id, plugin] of Object.entries(PLUGIN_API_MAP)) {
    if (plugin.routes.some(route => {
      const routeRegex = route.replace('*', '.*');
      const regex = new RegExp(`^${routeRegex}$`);
      return regex.test(fullPath);
    })) {
      pluginId = id;
      break;
    }
  }
  
  if (pluginId) {
    const enabled = isPluginEnabled(req, pluginId);
    if (!enabled) {
      console.log(`🚫 BLOCKED: Plugin ${pluginId} is disabled, rejecting ${fullPath}`);
      return res.status(403).json({
        success: false,
        error: `Plugin ${pluginId} is disabled`,
        code: 'PLUGIN_DISABLED',
        plugin: pluginId
      });
    }
  }
  
  next();
}

/**
 * Filter OpenAI tools based on enabled plugins
 */
export function filterToolsForOpenAI(req, allTools) {
  const availableTools = getAvailableTools(req);
  
  const filteredTools = allTools.filter(tool => {
    const toolName = tool.function?.name;
    if (!toolName) return false;
    
    const allowed = availableTools.has(toolName);
    if (!allowed) {
      console.log(`🚫 Filtering out tool: ${toolName} (plugin disabled)`);
    }
    return allowed;
  });
  
  console.log(`🛠️ OpenAI tools filtered: ${filteredTools.length}/${allTools.length} tools available`);
  return filteredTools;
}