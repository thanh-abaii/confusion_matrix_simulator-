import React, { useState } from 'react';
import { HelpCircle, Loader2 } from 'lucide-react';
import { askExplanation } from '../services/geminiService';
import { Scenario } from '../types';

interface Props {
  label: string;
  value: number;
  formula: string;
  color: string;
  scenario: Scenario;
  isGood?: boolean; // Higher is better?
}

const MetricCard: React.FC<Props> = ({ label, value, formula, color, scenario }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    if (explanation) return;
    setLoading(true);
    const text = await askExplanation(label, scenario);
    setExplanation(text);
    setLoading(false);
  };

  return (
    <div className={`bg-white rounded-lg p-4 border-l-4 shadow-sm hover:shadow-md transition-all relative`} style={{ borderColor: color }}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">{label}</h3>
        <button 
            onClick={handleAskAI}
            className="text-gray-400 hover:text-blue-500 transition-colors"
            title="Hỏi AI giải thích"
        >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <HelpCircle size={16} />}
        </button>
      </div>
      
      <div className="text-3xl font-bold text-gray-800 mb-1">
        {(value * 100).toFixed(1)}%
      </div>
      
      <div className="text-xs text-gray-400 font-mono bg-gray-50 p-1 rounded inline-block mb-2">
        {formula}
      </div>

      {/* AI Explanation Box */}
      {explanation && (
        <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100 italic animate-fadeIn">
            <span className="font-bold not-italic text-blue-600">AI: </span> 
            {explanation}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
