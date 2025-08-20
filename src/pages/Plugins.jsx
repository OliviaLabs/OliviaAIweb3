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
import { Power, PowerOff, Settings, Info, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';

const Plugins = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pluginStates, setPluginStates] = useState(getPluginStates());
  const [pluginCounts, setPluginCounts] = useState(getPluginCounts());

  useEffect(() => {
    setPluginStates(getPluginStates());
    setPluginCounts(getPluginCounts());
  }, []);

  const handleToggle = (pluginId) => {
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
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-400" />
              Plugin Manager
            </h1>
            <p className="text-gray-400 mt-1">
              Control which data sources and tools are active in your Olivia AI experience
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gray-900/50 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{pluginCounts.enabled}</div>
                <div className="text-sm text-gray-400">Enabled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{pluginCounts.disabled}</div>
                <div className="text-sm text-gray-400">Disabled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{pluginCounts.total}</div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleEnableAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 transition-colors"
              >
                <Power className="w-4 h-4" />
                Enable All
              </button>
              <button
                onClick={handleDisableAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
              >
                <PowerOff className="w-4 h-4" />
                Disable All
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Plugins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlugins.map(plugin => {
            const enabled = pluginStates[plugin.id] || false;
            
            return (
              <div
                key={plugin.id}
                className={`bg-gray-900/50 rounded-lg p-6 border transition-all duration-200 ${
                  enabled 
                    ? 'border-green-500/50 bg-green-900/10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                {/* Plugin Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={plugin.logo} 
                      alt={`${plugin.name} Logo`}
                      className={`w-12 h-12 rounded-lg object-cover transition-transform duration-200 ${
                        enabled ? 'scale-105' : 'grayscale opacity-70'
                      }`}
                    />
                    <div>
                      <h3 className={`font-semibold ${enabled ? `text-green-400` : 'text-white'}`}>
                        {plugin.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        plugin.category === 'Analytics' ? 'bg-purple-900/50 text-purple-300' :
                        plugin.category === 'Market Data' ? 'bg-blue-900/50 text-blue-300' :
                        plugin.category === 'Blockchain' ? 'bg-green-900/50 text-green-300' :
                        plugin.category === 'Exchange' ? 'bg-orange-900/50 text-orange-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {plugin.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(plugin.id)}
                    className={`flex items-center justify-center w-12 h-6 rounded-full transition-colors ${
                      enabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      enabled ? 'translate-x-3' : '-translate-x-3'
                    }`} />
                  </button>
                </div>

                {/* Plugin Description */}
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {plugin.description}
                </p>

                {/* Plugin Status */}
                <div className="flex items-center gap-2 text-sm">
                  {enabled ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400">Active</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span className="text-gray-500">Inactive</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-900/20 rounded-lg p-6 border border-blue-800/50">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">How Plugins Work</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Plugins provide real-time data to enhance Olivia AI's responses</li>
                <li>• Enabled plugins will show floating bubbles with live information</li>
                <li>• All plugins are optional - the core chat works without any plugins</li>
                <li>• Changes take effect immediately in your chat experience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plugins;
