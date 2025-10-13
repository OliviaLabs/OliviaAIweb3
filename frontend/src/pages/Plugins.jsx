import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AVAILABLE_PLUGINS, 
  getPluginStates, 
  togglePlugin, 
  enableAllPlugins, 
  disableAllPlugins, 
  getPluginCounts 
} from '../utils/pluginManager';
import { nowpaymentsService } from '../api';
import { ArrowLeft } from 'lucide-react';

const Plugins = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pluginStates, setPluginStates] = useState(getPluginStates());
  const [pluginCounts, setPluginCounts] = useState(getPluginCounts());
  const [selectedPlan, setSelectedPlan] = useState(() => {
    // Load selected plan from localStorage
    return localStorage.getItem('olivia-selected-plan') || 'free';
  });

  useEffect(() => {
    setPluginStates(getPluginStates());
    setPluginCounts(getPluginCounts());
  }, []);


  const getMaxPlugins = () => {
    switch (selectedPlan) {
      case 'free': return 2;
      case 'starter': return 4;
      case 'pro': return 8;
      case 'unlimited': return Infinity;
      default: return 2;
    }
  };

  const handleToggle = (pluginId) => {
    const newStates = { ...pluginStates };
    const isCurrentlyEnabled = pluginStates[pluginId] || false;
    
    if (!isCurrentlyEnabled) {
      // Trying to enable - check if we're at the limit
      const currentEnabled = Object.values(pluginStates).filter(Boolean).length;
      const maxAllowed = getMaxPlugins();
      
      if (currentEnabled >= maxAllowed) {
        alert(`You can only enable ${maxAllowed} plugins on your ${selectedPlan} plan. Upgrade to enable more plugins.`);
        return;
      }
    }
    
    togglePlugin(pluginId);
    setPluginStates(getPluginStates());
    setPluginCounts(getPluginCounts());
  };

  const handleEnableAll = () => {
    enableAllPlugins();
    setPluginStates(getPluginStates());
    setPluginCounts(getPluginCounts());
  };

  const handleDisableAll = () => {
    disableAllPlugins();
    setPluginStates(getPluginStates());
    setPluginCounts(getPluginCounts());
  };

  const categories = ['All', ...new Set(Object.values(AVAILABLE_PLUGINS).map(p => p.category))];
  const filteredPlugins = Object.values(AVAILABLE_PLUGINS).filter(plugin => 
    selectedCategory === 'All' || plugin.category === selectedCategory
  );

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* Content */}
      <div className="flex-1 text-white overflow-hidden flex flex-col relative z-10">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-sm border-b border-white/20 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-bold">Plugins</h1>
          <div className="text-sm text-white/70">
            {pluginCounts.enabled}/{pluginCounts.total}
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Simple Description */}
        <div className="mb-6 bg-white/5 rounded-lg p-4 border border-white/10">
          <h3 className="font-semibold text-white mb-2">Plugins for Olivia AI</h3>
          <p className="text-sm text-white/70">
            Enable plugins to give Olivia AI access to real-time data. You'll see her thoughts displayed as bubbles with the data she's using.
          </p>
        </div>

        {/* Plugin Stats */}
        <div className="mb-4 bg-white/5 rounded-lg p-3 border border-white/10">
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-4">
              <span className="text-white">{pluginCounts.enabled} Active</span>
              <span className="text-white/70">{pluginCounts.disabled} Inactive</span>
            </div>
            <span className="text-white/70">
              {selectedPlan === 'unlimited' ? 'Unlimited' : `${getMaxPlugins() - pluginCounts.enabled} left`}
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                selectedCategory === category
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Plugin Grid */}
        <div className="grid grid-cols-4 gap-4">
          {filteredPlugins.map(plugin => {
            const enabled = pluginStates[plugin.id] || false;
            
            return (
              <div
                key={plugin.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => handleToggle(plugin.id)}
              >
                {/* Plugin Icon */}
                <div className={`relative w-16 h-16 transition-all ${
                  enabled 
                    ? 'bg-white' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}>
                  <img 
                    src={plugin.logo} 
                    alt={`${plugin.name} Logo`}
                    className={`w-full h-full object-cover transition-all ${
                      enabled ? 'bg-white opacity-100' : 'grayscale opacity-20'
                    }`}
                    style={{
                      backgroundColor: enabled ? 'white' : 'transparent'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Text Fallback */}
                  <div className={`w-full h-full flex items-center justify-center text-lg font-bold hidden ${
                    enabled ? 'bg-white text-black' : 'bg-white/10 text-white/50'
                  }`}>
                    {plugin.name.charAt(0)}
                  </div>
                </div>

                {/* Plugin Name */}
                <div className="mt-2 text-center">
                  <div className={`text-xs font-medium ${
                    enabled ? 'text-white' : 'text-white/30'
                  }`}>
                    {plugin.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Small bottom padding */}
        <div className="h-2 md:h-4"></div>
      </div>
      </div>
    </div>
  );
};

export default Plugins;