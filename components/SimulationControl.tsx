import React, { useState } from 'react';
import { HelpCircle, Loader2, Info } from 'lucide-react';
import { askExplanation } from '../services/geminiService';
import { Scenario } from '../types';

interface Props {
  label: string;
  paramNameForAI: string; // Detailed name for better AI context (e.g. "Noise in data")
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  scenario: Scenario;
  disabled?: boolean;
}

const SimulationControl: React.FC<Props> = ({ 
    label, 
    paramNameForAI, 
    value, 
    onChange, 
    min, 
    max, 
    step, 
    scenario, 
    disabled 
}) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    if (explanation) {
        setExplanation(null); // Toggle off
        return;
    }
    setLoading(true);
    const text = await askExplanation(paramNameForAI, scenario);
    setExplanation(text);
    setLoading(false);
  };

  return (
    <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
          {label}
        </label>
        <button 
            onClick={handleAskAI}
            disabled={disabled}
            className={`text-gray-400 hover:text-blue-600 transition-colors ${explanation ? 'text-blue-600' : ''}`}
            title="AI Giải thích tham số này"
        >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <HelpCircle size={14} />}
        </button>
      </div>
      
      <div className="flex items-center gap-3">
          <input 
            type="range" 
            min={min} max={max} step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600 disabled:accent-gray-400"
          />
          <span className="text-xs font-mono w-8 text-right text-gray-700">{value.toFixed(2)}</span>
      </div>

      {/* AI Explanation Popup */}
      {explanation && (
        <div className="mt-2 text-xs text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200 shadow-sm animate-fadeIn relative">
            <div className="absolute -top-1.5 right-4 w-3 h-3 bg-blue-50 border-l border-t border-blue-200 transform rotate-45"></div>
            <div className="flex gap-2 items-start">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                    <span className="font-bold text-blue-700">AI Insight: </span> 
                    {explanation}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SimulationControl;