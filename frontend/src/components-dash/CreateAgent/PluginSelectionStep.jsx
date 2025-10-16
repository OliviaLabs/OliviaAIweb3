import { useState } from "react";
import { Button, Checkbox } from "@heroui/react";
import { AVAILABLE_PLUGINS } from "../../utils/pluginManager";
import { Zap } from "lucide-react";

export default function PluginSelectionStep({ wizardData, updateWizardData }) {
  const [selectedPlugins, setSelectedPlugins] = useState(
    wizardData.selectedPlugins || []
  );

  const handlePluginToggle = (pluginId) => {
    const newSelection = selectedPlugins.includes(pluginId)
      ? selectedPlugins.filter(id => id !== pluginId)
      : [...selectedPlugins, pluginId];
    
    setSelectedPlugins(newSelection);
    updateWizardData({ selectedPlugins: newSelection });
  };

  const categories = ['All', ...new Set(Object.values(AVAILABLE_PLUGINS).map(p => p.category))];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPlugins = Object.values(AVAILABLE_PLUGINS).filter(plugin => 
    selectedCategory === 'All' || plugin.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand" />
          Select Plugins
        </h4>
        <p className="text-sm text-gray-400 mt-1">
          Choose which APIs and data sources your AI agent can access
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            size="sm"
            className={`rounded-lg ${
              selectedCategory === category
                ? 'bg-brand text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onPress={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Selected Count */}
      <div className="text-sm text-gray-400">
        {selectedPlugins.length} plugin{selectedPlugins.length !== 1 ? 's' : ''} selected
      </div>

      {/* Plugin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredPlugins.map((plugin) => {
          const isSelected = selectedPlugins.includes(plugin.id);
          return (
            <div
              key={plugin.id}
              onClick={() => handlePluginToggle(plugin.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-brand bg-brand/10'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  isSelected={isSelected}
                  onValueChange={() => handlePluginToggle(plugin.id)}
                  className="mt-1"
                  classNames={{
                    wrapper: isSelected ? "bg-brand border-brand" : "border-gray-700"
                  }}
                />
                <img 
                  src={plugin.logo} 
                  alt={plugin.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-white truncate">
                    {plugin.name}
                  </h5>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                    {plugin.description}
                  </p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                    {plugin.category}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlugins.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No plugins selected. Your agent will work with basic functionality.</p>
          <p className="text-xs mt-1">Select at least one plugin to enhance your agent's capabilities.</p>
        </div>
      )}
    </div>
  );
}

