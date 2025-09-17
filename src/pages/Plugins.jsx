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
import { ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';

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
    <div className="h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* Fixed Header - More Compact */}
      <div className="flex-shrink-0 bg-black/95 backdrop-blur-sm border-b border-gray-800 z-10 px-3 py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-700 transition-colors text-xs"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back</span>
          </button>
          <h1 className="text-base font-bold">Plugins</h1>
          <div className="text-xs text-gray-400">
            {pluginCounts.enabled}/{pluginCounts.total}
          </div>
        </div>
      </div>

      {/* Content Container - Scrollable on desktop only */}
      <div className="flex-1 px-3 md:px-6 lg:px-8 overflow-y-auto md:overflow-y-auto max-w-7xl mx-auto w-full">
        {/* How it Works - Compact on Mobile */}
        <div className="mt-2 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-2 md:p-3 border border-blue-800/30">
          <h3 className="font-semibold text-blue-300 mb-1 text-xs md:text-sm">Plugins for Olivia AI</h3>
          <div className="hidden md:block text-xs text-gray-300 space-y-1" style={{fontSize: '11px', lineHeight: '16px'}}>
            <div>• <strong>Opening a whole new world of data</strong> to Olivia AI</div>
            <div>• You'll see <strong>her thoughts displayed as bubbles</strong> with crucial data she's found and is using</div>
            <div>• Each plugin provides specialized real-time information during your conversations</div>
            <div>• Tap icons below to enable/disable plugins - changes apply immediately</div>
          </div>
          <div className="md:hidden text-xs text-gray-300" style={{fontSize: '10px', lineHeight: '14px'}}>
            Tap plugins to enable/disable • Bubbles show AI's data sources
          </div>
        </div>

        {/* Responsive Stats - More Compact on Mobile */}
        <div className="bg-gray-900/30 rounded-lg p-2 md:p-3 my-2 md:my-3 border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex gap-3 md:gap-6 text-xs">
              <div>
                <span className="text-green-400 font-medium">{pluginCounts.enabled}</span>
                <span className="text-gray-400 ml-1 hidden sm:inline">Active</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium">{pluginCounts.disabled}</span>
                <span className="text-gray-400 ml-1 hidden sm:inline">Inactive</span>
              </div>
            </div>
            
            <div className="flex gap-1.5">
              <button
                onClick={handleEnableAll}
                className="px-2 py-0.5 md:py-1 rounded bg-green-600/80 hover:bg-green-600 transition-colors text-xs font-medium"
              >
                All On
              </button>
              <button
                onClick={handleDisableAll}
                className="px-2 py-0.5 md:py-1 rounded bg-red-600/80 hover:bg-red-600 transition-colors text-xs font-medium"
              >
                All Off
              </button>
            </div>
          </div>
        </div>

        {/* Compact Category Pills - Even Smaller on Mobile */}
        <div className="flex gap-1 mb-2 md:mb-3 overflow-x-auto pb-1">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-0.5 md:py-1 rounded-full whitespace-nowrap text-xs transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
              }`}
              style={{fontSize: '9px'}}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Responsive Plugin Grid - Tighter on Mobile */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-4">
          {filteredPlugins.map(plugin => {
            const enabled = pluginStates[plugin.id] || false;
            
            return (
              <div
                key={plugin.id}
                className="relative group flex flex-col items-center"
              >
                {/* Responsive Plugin Icon - Smaller on Mobile */}
                <div 
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                    enabled 
                      ? 'shadow-md shadow-green-500/30 scale-100' 
                      : 'grayscale opacity-60 scale-95 hover:scale-100'
                  }`}
                  onClick={() => handleToggle(plugin.id)}
                  title={plugin.description} // Tooltip on hover
                >
                  {/* Icon Background */}
                  <div 
                    className={`w-full h-full flex items-center justify-center rounded-xl border transition-all ${
                      enabled 
                        ? plugin.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-700 border-purple-400/50' :
                          plugin.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-700 border-green-400/50' :
                          plugin.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400/50' :
                          plugin.color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-700 border-orange-400/50' :
                          'bg-gradient-to-br from-gray-500 to-gray-700 border-gray-400/50'
                        : 'bg-gradient-to-br from-gray-600 to-gray-800 border-gray-600/30'
                    }`}
                  >
                    {/* Plugin Logo */}
                    <img 
                      src={plugin.logo} 
                      alt={`${plugin.name} Logo`}
                      className="w-6 h-6 sm:w-8 sm:h-8 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded object-cover"
                      onError={(e) => {
                        // Fallback for broken images
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    {/* Text Fallback */}
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-6 md:h-6 lg:w-7 lg:h-7 rounded bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-sm md:text-xs lg:text-sm font-bold hidden">
                      {plugin.name.charAt(0)}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className={`absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-3 md:h-3 lg:w-4 lg:h-4 rounded-full flex items-center justify-center transition-all ${
                    enabled 
                      ? 'bg-green-400 shadow-md shadow-green-400/50' 
                      : 'bg-gray-500'
                  }`}>
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-1.5 md:h-1.5 lg:w-2 lg:h-2 rounded-full bg-white"></div>
                  </div>

                  {/* Mobile Description Popup */}
                  <div className="md:hidden absolute -bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs p-2 rounded-lg shadow-lg opacity-0 group-active:opacity-100 transition-opacity z-20 w-40 text-center pointer-events-none">
                    {plugin.description}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                </div>

                {/* Plugin Name - Compact */}
                <div className="mt-1 text-center w-full">
                  <div className={`text-xs font-medium truncate transition-colors ${
                    enabled ? 'text-white' : 'text-gray-500'
                  }`} style={{fontSize: '10px'}}>
                    {plugin.name}
                  </div>
                  {/* Desktop Description - shows on larger screens */}
                  <div className={`hidden lg:block text-xs text-gray-400 mt-1 leading-relaxed ${
                    enabled ? 'text-gray-300' : 'text-gray-500'
                  }`} style={{fontSize: '10px', lineHeight: '13px'}}>
                    {plugin.description}
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
  );
};

export default Plugins;