import { useState } from "react";
import { Button } from "@heroui/react";
import { Copy, Edit, Sparkles } from "lucide-react";

export default function Step1({ wizardData, updateWizardData }) {
  const [selectedOption, setSelectedOption] = useState(wizardData.creationType || "");

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    updateWizardData({ creationType: option });
  };

  const creationOptions = [
    {
      key: "clone",
      name: "Clone Agent",
      description: "Create a new agent by duplicating one of your existing agents",
      icon: Copy,
    },
    {
      key: "manual",
      name: "Manual Create Agent",
      description: "Build your agent from scratch with full control over all settings",
      icon: Edit,
    },
    {
      key: "auto",
      name: "AutoAgent",
      description: "Speak with Olivia AI to have an agent created for your specific needs",
      icon: Sparkles,
      disabled: true,
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium text-white">
        How would you like to create your agent?
      </h4>
      <div className="grid gap-4">
        {creationOptions.map((option) => (
          <Button
            key={option.key}
            className={`justify-start p-4 h-auto rounded-xl ${
              selectedOption === option.key
                ? "border-2 border-brand bg-brand/20"
                : "bg-gray-900 hover:bg-gray-800 border border-gray-800"
            } ${option.disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            startContent={
              option.icon && (
                <option.icon className={`w-5 h-5 mr-3 ${selectedOption === option.key ? 'text-brand' : 'text-gray-400'}`} />
              )
            }
            onPress={() => !option.disabled && handleOptionSelect(option.key)}
            isDisabled={option.disabled}
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center">
                <span className="text-white font-medium">{option.name}</span>
                {option.comingSoon && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">Coming Soon</span>
                )}
              </div>
              <span className="text-sm text-gray-400 mt-1">
                {option.description}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
