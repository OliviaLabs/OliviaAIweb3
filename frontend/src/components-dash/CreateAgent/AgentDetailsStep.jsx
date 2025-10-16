import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Textarea,
} from "@heroui/react";
import { Plus, X, FileText, Sparkles, Zap } from "lucide-react";
import RegenerateQAModal from "./RegenerateQAModal";
import { AVAILABLE_PLUGINS } from "../../utils/pluginManager";

export default function AgentDetailsStep({ wizardData, updateWizardData }) {
  // Debug: Log the wizardData to see if analysisResult is being passed correctly
  //console.log("AgentDetailsStep wizardData:", wizardData);
  //console.log("Analysis result:", wizardData?.manualData?.analysisResult);

  // Extract agent info and QA pairs from analysis result if available
  const analysisResult = wizardData?.manualData?.analysisResult;
  const agentInfo = analysisResult?.agentInfo;
  const qaPairs = analysisResult?.qaPairs;

  //console.log("Agent info:", agentInfo);
  //console.log("QA pairs:", qaPairs);

  // Initialize with data from analysis result or defaults
  const initialAgentName = agentInfo?.bot_name || "";
  const initialQAItems = qaPairs?.length
    ? qaPairs.map(pair => ({ question: pair.question, answer: pair.answer }))
    : [{ question: "", answer: "" }];
  const initialAdditionalInfo = agentInfo?.company_services || "";

  // console.log("Initial agent name:", initialAgentName);
  // console.log("Initial QA items:", initialQAItems);
  // console.log("Initial additional info:", initialAdditionalInfo);

  // Initialize with existing data or defaults
  const [detailsData, setDetailsData] = useState(wizardData.detailsData || {
    agentName: initialAgentName,
    qaItems: initialQAItems,
    additionalInfo: initialAdditionalInfo,
  });

  // Plugin selection state
  const [selectedPlugins, setSelectedPlugins] = useState(
    wizardData.selectedPlugins || []
  );
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Update wizard data immediately if we have initial data from analysis result
  useEffect(() => {
    if (!wizardData.detailsData && (initialAgentName || initialAdditionalInfo || initialQAItems.length > 1 || initialQAItems[0]?.question || initialQAItems[0]?.answer)) {
      const initialData = {
        agentName: initialAgentName,
        qaItems: initialQAItems,
        additionalInfo: initialAdditionalInfo,
      };
      setDetailsData(initialData);
      updateWizardData({ detailsData: initialData });
    }
  }, [initialAgentName, initialAdditionalInfo, initialQAItems, wizardData.detailsData, updateWizardData]);

  const handleInputChange = (field, value) => {
    const updatedData = { ...detailsData, [field]: value };
    setDetailsData(updatedData);
    updateWizardData({ detailsData: updatedData });
  };

  const handleQAChange = (index, field, value) => {
    const updatedQA = [...detailsData.qaItems];
    updatedQA[index] = { ...updatedQA[index], [field]: value };

    const updatedData = { ...detailsData, qaItems: updatedQA };
    setDetailsData(updatedData);
    updateWizardData({ detailsData: updatedData });
  };

  const addQAItem = () => {
    const updatedQA = [...detailsData.qaItems, { question: "", answer: "" }];
    const updatedData = { ...detailsData, qaItems: updatedQA };
    setDetailsData(updatedData);
    updateWizardData({ detailsData: updatedData });
  };

  const removeQAItem = (index) => {
    const updatedQA = detailsData.qaItems.filter((_, i) => i !== index);
    const updatedData = { ...detailsData, qaItems: updatedQA };
    setDetailsData(updatedData);
    updateWizardData({ detailsData: updatedData });
  };

  const handleRegenerate = (regeneratedQA) => {
    //console.log("Received regenerated Q&A pairs:", regeneratedQA);

    if (Array.isArray(regeneratedQA) && regeneratedQA.length > 0) {
      // Update the QA items with the regenerated ones
      // Replace the entire array, not append
      const updatedData = {
        ...detailsData,
        qaItems: regeneratedQA
      };

      //console.log("Updating QA items with:", updatedData.qaItems);

      setDetailsData(updatedData);
      updateWizardData({ detailsData: updatedData });
    } else {
      console.error("Invalid regenerated Q&A format:", regeneratedQA);
    }
  };

  return (
    <div className="space-y-6 px-1">
      <div className="flex flex-col justify-center items-center gap-1 mb-6">
        <h3 className="font-bold text-lg text-white">Configure Your Agent</h3>
        <span className="text-xs text-gray-400">Provide details to personalize your AI assistant</span>
      </div>

      {/* Agent Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          Agent Name <span className="text-brand">*</span>
        </label>
        <Input
          placeholder="Enter a name for your agent"
          value={detailsData.agentName}
          onChange={(e) => handleInputChange("agentName", e.target.value)}
          className="w-full"
          classNames={{
            inputWrapper: "bg-gray-900 border-gray-800 rounded-xl",
            input: "text-white"
          }}
        />
      </div>

      {/* Additional Information */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-base font-medium text-white">Additional Information</h4>
            <p className="text-xs text-gray-400">Provide any other details that will help your AI assistant</p>
          </div>
          <div className="text-xs text-gray-400">
            Makes responses more accurate
          </div>
        </div>

        <div className="rounded-xl bg-gray-900 border border-gray-800">
          <div className="flex items-start">
            <Textarea
              placeholder="Add any additional context, information, or instructions for your AI assistant..."
              value={detailsData.additionalInfo}
              onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
              className="w-full"
              classNames={{
                inputWrapper: "bg-gray-900 border-0 rounded-xl",
                input: "text-white"
              }}
              rows={6}
            />
          </div>
        </div>
      </div>

      {/* Plugin Selection */}
      <div className="space-y-4 mt-8 pt-8 border-t border-gray-800">
        <div>
          <h4 className="text-base font-medium text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand" />
            Select Plugins for Your Agent
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Choose which APIs and data sources your AI agent can access ({selectedPlugins.length} selected)
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {['All', ...new Set(Object.values(AVAILABLE_PLUGINS).map(p => p.category))].map((category) => (
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

        {/* Plugin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
          {Object.values(AVAILABLE_PLUGINS)
            .filter(plugin => selectedCategory === 'All' || plugin.category === selectedCategory)
            .map((plugin) => {
              const isSelected = selectedPlugins.includes(plugin.id);
              return (
                <div
                  key={plugin.id}
                  onClick={() => {
                    const newSelection = isSelected
                      ? selectedPlugins.filter(id => id !== plugin.id)
                      : [...selectedPlugins, plugin.id];
                    setSelectedPlugins(newSelection);
                    updateWizardData({ selectedPlugins: newSelection });
                  }}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand bg-brand/10'
                      : 'border-gray-800 bg-black hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isSelected ? 'bg-brand/20 ring-2 ring-brand' : 'bg-gray-800'
                    }`}>
                      <img 
                        src={plugin.logo} 
                        alt={plugin.name}
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-white truncate">
                        {plugin.name}
                      </h5>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {plugin.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

    </div>
  );
}
