import React, { useState, useEffect } from 'react';
import { 
  AVAILABLE_PLUGINS, 
  getPluginStates, 
  togglePlugin, 
  enableAllPlugins, 
  disableAllPlugins, 
  getPluginCounts 
} from '../../utils/pluginManager';
import { Power, PowerOff, Settings, Info, ToggleLeft, ToggleRight } from 'lucide-react';

const PluginManager = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [pluginStates, setPluginStates] = useState(getPluginStates());
  const [pluginCounts, setPluginCounts] = useState(getPluginCounts());

  // Refresh plugin states when modal opens
  useEffect(() => {
    if (isOpen) {
      setPluginStates(getPluginStates());
      setPluginCounts(getPluginCounts());
    }
  }, [isOpen]);

  // Handle plugin toggle
  const handleToggle = (pluginId) => {
    togglePlugin(pluginId);
    setPluginStates(getPluginStates());
    setPluginCounts(getPluginCounts());
  };

  // Handle enable all
  const handleEnableAll = () => {
    enableAllPlugins();
    setPluginStates(getPluginStates());
    setPluginCounts(getPluginCounts());
  };

  // Handle disable all
  const handleDisableAll = () => {
    disableAllPlugins();
    setPluginStates(getPluginStates());
    setPluginCounts(getPluginCounts());
  };

  // Get unique categories
  const categories = ['All', ...new Set(Object.values(AVAILABLE_PLUGINS).map(p => p.category))];

  // Filter plugins by category
  const filteredPlugins = Object.values(AVAILABLE_PLUGINS).filter(plugin => 
    selectedCategory === 'All' || plugin.category === selectedCategory
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-green-500/30 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Settings className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Plugin Manager</h2>
                <p className="text-gray-400 text-sm">
                  {pluginCounts.enabled} of {pluginCounts.total} plugins enabled
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleEnableAll}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
            >
              <Power className="w-4 h-4" />
              Enable All
            </button>
            <button
              onClick={handleDisableAll}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
            >
              <PowerOff className="w-4 h-4" />
              Disable All
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Plugin List */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-4">
            {filteredPlugins.map(plugin => {
              const enabled = pluginStates[plugin.id] || false;
              
              return (
                <div
                  key={plugin.id}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    enabled 
                      ? `bg-${plugin.color}-500/5 border-${plugin.color}-500/30 shadow-lg shadow-${plugin.color}-500/10` 
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Plugin Logo */}
                      <div className={`p-2 rounded-lg transition-all duration-200 ${
                        enabled 
                          ? `bg-${plugin.color}-500/20 border-2 border-${plugin.color}-500/30 shadow-lg shadow-${plugin.color}-500/20` 
                          : 'bg-gray-700/50 border-2 border-gray-600'
                      }`}>
                        <img 
                          src={plugin.logo} 
                          alt={`${plugin.name} Logo`}
                          className={`w-10 h-10 rounded-lg object-cover transition-transform duration-200 ${
                            enabled ? 'scale-105' : 'grayscale opacity-70'
                          }`}
                        />
                      </div>

                      {/* Plugin Info */}
                      <div className="flex-1">
                        <h3 className={`font-semibold ${enabled ? `text-${plugin.color}-400` : 'text-white'}`}>
                          {plugin.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {plugin.description}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                          enabled 
                            ? `bg-${plugin.color}-500/20 text-${plugin.color}-400` 
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {plugin.category}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggle(plugin.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        enabled
                          ? `bg-${plugin.color}-500/20 text-${plugin.color}-400 hover:bg-${plugin.color}-500/30 border border-${plugin.color}-500/30`
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      {enabled ? (
                        <>
                          <ToggleRight className="w-5 h-5" />
                          <span className="text-sm font-medium">ON</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5" />
                          <span className="text-sm font-medium">OFF</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Status indicator for enabled plugins */}
                  {enabled && (
                    <div className={`mt-3 pt-3 border-t border-${plugin.color}-500/20`}>
                      <div className={`flex items-center gap-2 text-${plugin.color}-400 text-xs`}>
                        <div className={`w-2 h-2 bg-${plugin.color}-400 rounded-full animate-pulse`}></div>
                        Plugin active - bubbles will appear when relevant
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/30">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Info className="w-4 h-4" />
            <p>
              Enabled plugins will show floating bubbles with real-time data during your AI conversations.
              You can enable/disable plugins anytime without losing your conversation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PluginManager;
