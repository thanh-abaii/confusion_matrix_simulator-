import React from 'react';
import { MatrixValues, Scenario, MatrixRegion } from '../types';
import { HelpCircle, Edit3 } from 'lucide-react';

interface Props {
  values: MatrixValues;
  scenario: Scenario;
  isManualMode?: boolean;
  onUpdate?: (key: keyof MatrixValues, value: number) => void;
  hoveredRegion?: MatrixRegion;
  setHoveredRegion?: (region: MatrixRegion) => void;
}

const MatrixGrid: React.FC<Props> = ({ 
    values, 
    scenario, 
    isManualMode = false, 
    onUpdate,
    hoveredRegion,
    setHoveredRegion
}) => {
  const total = values.tp + values.tn + values.fp + values.fn;
  
  // Helper to format percent
  const pct = (val: number) => total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '0%';

  // Helper to render value or input
  const renderValue = (key: 'tp' | 'tn' | 'fp' | 'fn', colorClass: string) => {
    if (isManualMode && onUpdate) {
        return (
            <div className="flex flex-col items-center justify-center w-full">
                <input 
                    type="number" 
                    value={Math.round(values[key])}
                    onChange={(e) => onUpdate(key, parseInt(e.target.value) || 0)}
                    className={`w-24 text-center text-2xl font-bold bg-white border-b-2 outline-none focus:ring-0 p-1 ${colorClass}`}
                />
                <Edit3 size={12} className="text-gray-400 mt-1"/>
            </div>
        )
    }
    return (
        <div className={`text-3xl font-bold mt-2 ${colorClass}`}>
            {Math.round(values[key])}
        </div>
    );
  }

  // Helper for cell opacity based on hover state
  const getCellClass = (region: MatrixRegion) => {
      const base = "rounded-lg p-2 relative group transition-all flex flex-col justify-center items-center text-center border";
      if (!hoveredRegion) return `${base} hover:shadow-lg hover:scale-[1.02] cursor-pointer`;
      // If hovering something, dim others
      if (hoveredRegion !== region) return `${base} opacity-40 grayscale-[0.5] scale-95`;
      // Highlight current
      return `${base} shadow-xl scale-105 ring-2 ring-offset-2 ring-blue-400 z-10`;
  };

  const handleEnter = (r: MatrixRegion) => setHoveredRegion && setHoveredRegion(r);
  const handleLeave = () => setHoveredRegion && setHoveredRegion(null);

  return (
    <div className="flex flex-col items-center">
        {/* Header Title for the Matrix */}
        <div className="mb-4 text-center">
             <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2 justify-center">
                Confusion Matrix 
                {isManualMode && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded border border-red-200 uppercase">Manual Input</span>}
             </h4>
             <p className="text-xs text-gray-400">So sánh Nhãn Thực tế (trục Y) vs. Dự đoán (trục X)</p>
        </div>

        {/* Container: Increased left padding (pl-14) to contain the vertical label inside */}
        <div className="relative bg-white py-6 pr-6 pl-14 rounded-xl shadow-sm border border-gray-200 inline-block">
            
            {/* Vertical Label (Rotated) - Moved INSIDE the padding area */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-0 h-0 flex items-center justify-center">
                <div className="-rotate-90 whitespace-nowrap font-bold text-gray-500 tracking-widest text-xs uppercase flex items-center gap-2 origin-center">
                    Thực tế (Ground Truth)
                    <div className="group relative inline-block rotate-90 ml-1">
                        <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 cursor-help" />
                        {!isManualMode && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 normal-case text-center font-normal tracking-normal">
                            Dữ liệu thật mà chúng ta đã biết nhãn (Label) trước đó.
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Grid Container */}
            <div className="grid grid-cols-[auto_140px_140px] gap-x-4 gap-y-4" onMouseLeave={handleLeave}>
                
                {/* --- Header Row --- */}
                
                {/* Top Left Corner */}
                <div className="flex flex-col justify-end items-end pb-2 pr-2 border-r border-b border-gray-100">
                </div>

                {/* Predicted Negative Header (Left Column) */}
                <div className="text-center pb-2 border-b-2 border-emerald-100 group relative cursor-help">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1 flex justify-center items-center gap-1">
                        Dự đoán (Predicted) <HelpCircle size={10} />
                    </div>
                    <div className="text-sm font-bold text-gray-700 truncate" title={scenario.negativeLabel}>{scenario.negativeLabel}</div>
                    <div className="text-[10px] text-gray-400 font-mono">(0) Negative</div>
                    {!isManualMode && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-40 bg-gray-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-normal">
                        Máy tính dự đoán kết quả là Âm tính (0).
                    </div>
                    )}
                </div>
                
                {/* Predicted Positive Header (Right Column) - RED THEME */}
                <div className="text-center pb-2 border-b-2 border-red-100 group relative cursor-help">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1 flex justify-center items-center gap-1">
                        Dự đoán (Predicted) <HelpCircle size={10} />
                    </div>
                    <div className="text-sm font-bold text-gray-700 truncate" title={scenario.positiveLabel}>{scenario.positiveLabel}</div>
                    <div className="text-[10px] text-gray-400 font-mono">(1) Positive</div>
                    {!isManualMode && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-40 bg-gray-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none font-normal">
                        Máy tính dự đoán kết quả là Dương tính (1).
                    </div>
                    )}
                </div>

                {/* --- Row 1: Actual Positive (TOP ROW - Cartesian y=1) --- */}

                {/* Row Label - RED THEME */}
                <div className="flex flex-col justify-center items-end pr-4 border-r-2 border-red-100 min-h-[120px] group relative cursor-help">
                    <div className="text-sm font-bold text-gray-700 text-right leading-tight mb-1">{scenario.positiveLabel}</div>
                    <div className="text-[10px] text-gray-400 font-mono text-right">(1) Actual Pos</div>
                </div>

                {/* FN Cell (Actual Pos, Pred Neg) -> ERROR (Missed Positive) -> PURPLE/GRAY */}
                <div 
                    className={`${getCellClass('fn')} bg-slate-100 border-slate-300 ${isManualMode ? 'ring-2 ring-slate-200' : ''}`}
                    onMouseEnter={() => handleEnter('fn')}
                >
                    <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-600 uppercase tracking-wide opacity-70">FN</div>
                    
                    {renderValue('fn', 'text-slate-700')}
                    <div className="text-sm text-slate-500 font-medium">{pct(values.fn)}</div>

                    <div className="mt-2 text-[10px] text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                        Sai (Type II Error)
                    </div>

                    {!isManualMode && (
                    <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg border-2 border-slate-300 flex flex-col items-center justify-center text-center pointer-events-none">
                        <p className="text-xs font-bold text-slate-700 mb-1">Bỏ sót (Missed)</p>
                        <p className="text-[11px] text-gray-600 leading-tight mb-1">
                            Thực tế là <b>{scenario.positiveLabel}</b><br/>
                            Nhưng đoán nhầm là <b>{scenario.negativeLabel}</b>
                        </p>
                    </div>
                    )}
                </div>

                {/* TP Cell (Actual Pos, Pred Pos) -> CORRECT POSITIVE -> RED */}
                <div 
                    className={`${getCellClass('tp')} bg-red-50 border-red-200 ${isManualMode ? 'ring-2 ring-red-200' : ''}`}
                    onMouseEnter={() => handleEnter('tp')}
                >
                    <div className="absolute top-2 left-2 text-[10px] font-bold text-red-700 uppercase tracking-wide opacity-70">TP</div>
                    
                    {renderValue('tp', 'text-red-800')}
                    <div className="text-sm text-red-600 font-medium">{pct(values.tp)}</div>

                    <div className="mt-2 text-[10px] text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                        Đúng (True Positive)
                    </div>

                     {!isManualMode && (
                     <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg border-2 border-red-300 flex flex-col items-center justify-center text-center pointer-events-none">
                        <p className="text-xs font-bold text-red-700 mb-1">Chính xác!</p>
                        <p className="text-[11px] text-gray-600 leading-tight">
                            Thực tế là <b>{scenario.positiveLabel}</b><br/>
                            Máy đoán đúng là <b>{scenario.positiveLabel}</b>
                        </p>
                    </div>
                    )}
                </div>


                {/* --- Row 2: Actual Negative (BOTTOM ROW - Cartesian y=0) --- */}

                {/* Row Label */}
                <div className="flex flex-col justify-center items-end pr-4 border-r-2 border-emerald-100 min-h-[120px] group relative cursor-help">
                    <div className="text-sm font-bold text-gray-700 text-right leading-tight mb-1">{scenario.negativeLabel}</div>
                    <div className="text-[10px] text-gray-400 font-mono text-right">(0) Actual Neg</div>
                </div>

                {/* TN Cell (Actual Neg, Pred Neg) -> CORRECT NEGATIVE -> GREEN */}
                <div 
                    className={`${getCellClass('tn')} bg-emerald-50 border-emerald-200 ${isManualMode ? 'ring-2 ring-emerald-200' : ''}`}
                    onMouseEnter={() => handleEnter('tn')}
                >
                    <div className="absolute top-2 left-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wide opacity-70">TN</div>
                    
                    {renderValue('tn', 'text-emerald-800')}
                    <div className="text-sm text-emerald-600 font-medium">{pct(values.tn)}</div>
                    
                    <div className="mt-2 text-[10px] text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded-full">
                        Đúng (True Negative)
                    </div>

                    {!isManualMode && (
                    <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg border-2 border-emerald-300 flex flex-col items-center justify-center text-center pointer-events-none">
                        <p className="text-xs font-bold text-emerald-700 mb-1">Chính xác!</p>
                        <p className="text-[11px] text-gray-600 leading-tight">
                            Thực tế là <b>{scenario.negativeLabel}</b><br/>
                            Máy đoán đúng là <b>{scenario.negativeLabel}</b>
                        </p>
                    </div>
                    )}
                </div>

                {/* FP Cell (Actual Neg, Pred Pos) -> ERROR (False Alarm) -> ORANGE */}
                <div 
                    className={`${getCellClass('fp')} bg-orange-50 border-orange-200 ${isManualMode ? 'ring-2 ring-orange-200' : ''}`}
                    onMouseEnter={() => handleEnter('fp')}
                >
                    <div className="absolute top-2 left-2 text-[10px] font-bold text-orange-700 uppercase tracking-wide opacity-70">FP</div>
                    
                    {renderValue('fp', 'text-orange-800')}
                    <div className="text-sm text-orange-600 font-medium">{pct(values.fp)}</div>

                    <div className="mt-2 text-[10px] text-orange-800 bg-orange-100/50 px-2 py-0.5 rounded-full">
                        Sai (Type I Error)
                    </div>

                    {!isManualMode && (
                    <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg border-2 border-orange-300 flex flex-col items-center justify-center text-center pointer-events-none">
                        <p className="text-xs font-bold text-orange-700 mb-1">Báo động giả (False Alarm)</p>
                        <p className="text-[11px] text-gray-600 leading-tight mb-1">
                            Thực tế là <b>{scenario.negativeLabel}</b><br/>
                            Nhưng đoán nhầm là <b>{scenario.positiveLabel}</b>
                        </p>
                    </div>
                    )}
                </div>

            </div>
        </div>
    </div>
  );
};

export default MatrixGrid;