import React, { useMemo, useRef } from 'react';
import { DistributionPoint, MatrixRegion } from '../types';

interface Props {
  threshold: number;
  setThreshold: (val: number) => void;
  separation: number; // Distance between peaks (0 to 1)
  noise: number; // Standard deviation spread
  readOnly?: boolean;
  hoveredRegion?: MatrixRegion;
  setHoveredRegion?: (region: MatrixRegion) => void;
}

// Gaussian function
const gaussian = (x: number, mean: number, std: number) => {
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
};

const DistributionVis: React.FC<Props> = ({ 
    threshold, 
    setThreshold, 
    separation, 
    noise, 
    readOnly = false,
    hoveredRegion,
    setHoveredRegion
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const data = useMemo(() => {
    const points: DistributionPoint[] = [];
    // Generate points from -3 to 3 standard deviations spread
    // Map x from 0 to 100 for the chart coordinates
    for (let i = 0; i <= 100; i++) {
      const x = i / 100; // normalized 0-1
      // Negative class (Left)
      const negDist = gaussian(x, 0.5 - (separation / 2), noise);
      // Positive class (Right)
      const posDist = gaussian(x, 0.5 + (separation / 2), noise);
      points.push({ x, negDist, posDist });
    }
    return points;
  }, [separation, noise]);

  // Calculate Max Y for scaling
  const maxY = useMemo(() => Math.max(...data.map(p => Math.max(p.negDist, p.posDist))) * 1.1, [data]);

  // Helper to scale coordinates
  const getX = (val: number, width: number) => val * width;
  const getY = (val: number, height: number) => height - (val / maxY) * height;

  // Split Path Generator: Generates a closed path for a specific condition (Left/Right of threshold)
  const generateArea = (width: number, height: number, type: 'pos' | 'neg', condition: 'left' | 'right') => {
    let d = `M `;
    
    // Filter points based on condition relative to threshold
    const filteredPoints = data.filter(p => condition === 'left' ? p.x <= threshold : p.x >= threshold);
    
    // Add threshold intersection points to ensure clean shapes
    // Find interpolated Y at threshold
    const t = threshold;
    const negAtT = gaussian(t, 0.5 - (separation / 2), noise);
    const posAtT = gaussian(t, 0.5 + (separation / 2), noise);
    const yAtT = type === 'pos' ? posAtT : negAtT;

    const thresholdPoint = { x: t, y: yAtT };
    
    // Start Point (Bottom)
    if (condition === 'left') {
        d += `0 ${height}`;
        filteredPoints.forEach(p => {
             d += ` L ${getX(p.x, width)} ${getY(type === 'pos' ? p.posDist : p.negDist, height)}`;
        });
        // Add point at threshold
        d += ` L ${getX(thresholdPoint.x, width)} ${getY(thresholdPoint.y, height)}`;
        // Drop to bottom at threshold
        d += ` L ${getX(thresholdPoint.x, width)} ${height} Z`;
    } else {
        // Right side
        // Start at bottom threshold
        d += `${getX(thresholdPoint.x, width)} ${height}`;
        // Go up to curve at threshold
        d += ` L ${getX(thresholdPoint.x, width)} ${getY(thresholdPoint.y, height)}`;
        filteredPoints.forEach(p => {
            d += ` L ${getX(p.x, width)} ${getY(type === 'pos' ? p.posDist : p.negDist, height)}`;
        });
        // Drop to bottom at end
        d += ` L ${width} ${height} Z`;
    }
    return d;
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    let newThresh = (clientX - rect.left) / rect.width;
    newThresh = Math.max(0, Math.min(1, newThresh));
    setThreshold(newThresh);
  };

  // Helper for region opacity
  const getOpacity = (region: MatrixRegion) => {
      if (!hoveredRegion) return 0.6; // Default visibility
      return hoveredRegion === region ? 0.9 : 0.1; // Highlight active, dim others
  };

  const getStrokeOpacity = (region: MatrixRegion) => {
      if (!hoveredRegion) return 1;
      return hoveredRegion === region ? 1 : 0.2;
  };

  return (
    <div className={`w-full select-none relative group transition-all duration-300`}>
       {/* Header & Instruction */}
       <div className="flex justify-between items-end mb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-gray-500">Phân phối xác suất (Probability Density)</div>
            {readOnly && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">Mô phỏng từ dữ liệu nhập</span>}
          </div>
          {!readOnly && (
              <div className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                🖱️ Click/Drag để thay đổi ngưỡng
              </div>
          )}
       </div>

      <div 
        ref={containerRef}
        className={`h-64 w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative ${!readOnly ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseDown={(e) => {
            if (readOnly) return;
            handleInteraction(e);
            const moveHandler = (ev: MouseEvent) => handleInteraction(ev as unknown as React.MouseEvent);
            const upHandler = () => {
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', upHandler);
            };
            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        }}
        onTouchStart={(e) => handleInteraction(e)}
        onTouchMove={(e) => handleInteraction(e)}
        onMouseLeave={() => setHoveredRegion?.(null)}
      >
        {/* Logical coordinates: 0-1000 width, 0-256 height */}
        <svg viewBox="0 0 1000 256" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          
          {/* X-Axis Grid Lines */}
          {[0, 250, 500, 750, 1000].map(x => (
              <line key={x} x1={x} y1={0} x2={x} y2={256} stroke="#e5e7eb" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          ))}

          {/* --- 4 SPLIT AREAS --- */}

          {/* TN Area: Negative Curve (Green) LEFT of Threshold */}
          <path 
            d={generateArea(1000, 256, 'neg', 'left')} 
            fill="#10b981" 
            fillOpacity={getOpacity('tn') * 0.3}
            stroke="#10b981" 
            strokeWidth="2" 
            strokeOpacity={getStrokeOpacity('tn')}
            vectorEffect="non-scaling-stroke" 
            className="transition-all duration-200"
          />
          
          {/* FP Area: Negative Curve (Green) RIGHT of Threshold */}
          {/* This is the "Tail" of the Green curve spilling into Positive territory */}
          <path 
            d={generateArea(1000, 256, 'neg', 'right')} 
            fill="#f97316" // Orange for "False Alarm"
            fillOpacity={getOpacity('fp') * 0.4}
            stroke="#f97316" 
            strokeWidth="2" 
            strokeOpacity={getStrokeOpacity('fp')}
            vectorEffect="non-scaling-stroke" 
            className="transition-all duration-200"
          />

          {/* FN Area: Positive Curve (Red) LEFT of Threshold */}
          {/* This is the "Tail" of the Red curve hidden in Negative territory */}
          <path 
            d={generateArea(1000, 256, 'pos', 'left')} 
            fill="#64748b" // Slate/Purple for "Missed"
            fillOpacity={getOpacity('fn') * 0.4}
            stroke="#64748b" 
            strokeWidth="2" 
            strokeOpacity={getStrokeOpacity('fn')}
            vectorEffect="non-scaling-stroke" 
            className="transition-all duration-200"
          />

          {/* TP Area: Positive Curve (Red) RIGHT of Threshold */}
          <path 
            d={generateArea(1000, 256, 'pos', 'right')} 
            fill="#ef4444" 
            fillOpacity={getOpacity('tp') * 0.3}
            stroke="#ef4444" 
            strokeWidth="2" 
            strokeOpacity={getStrokeOpacity('tp')}
            vectorEffect="non-scaling-stroke" 
            className="transition-all duration-200"
          />

        </svg>

        {/* Interactive Overlay Zones for Hovering on Chart directly */}
        {setHoveredRegion && (
            <>
                {/* Left Side Overlay */}
                <div className="absolute top-0 bottom-0 left-0 z-10 flex" style={{ width: `${threshold * 100}%` }}>
                    {/* TN Zone (Top/Middle) roughly */}
                    <div className="flex-1 h-full hover:bg-emerald-500/5" onMouseEnter={() => setHoveredRegion('tn')} />
                    {/* FN Zone (Bottom/Overlap) - Hard to split perfectly with div, relying on visual approximation */}
                </div>
                {/* Right Side Overlay */}
                <div className="absolute top-0 bottom-0 right-0 z-10 flex" style={{ width: `${(1-threshold) * 100}%` }}>
                     <div className="flex-1 h-full hover:bg-red-500/5" onMouseEnter={() => setHoveredRegion('tp')} />
                </div>
            </>
        )}

        {/* Threshold Line */}
        <div 
            className={`absolute top-0 bottom-6 w-0.5 bg-gray-800 z-20 shadow-lg transform -translate-x-1/2 transition-all duration-300 ${!readOnly ? 'hover:bg-black hover:w-1 cursor-ew-resize' : 'bg-gray-600/50 dashed'}`}
            style={{ left: `${threshold * 100}%` }}
        >
             {!readOnly && (
             <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                T = {threshold.toFixed(2)}
             </div>
             )}
        </div>

        {/* Prediction Zones Labels */}
        <div className="absolute top-2 left-[5%] text-xs text-gray-400 border-b border-gray-300 pb-1 whitespace-nowrap overflow-hidden text-center pointer-events-none" style={{width: `${Math.max(0, threshold * 90)}%`}}>
            Dự đoán: Negative (0)
        </div>
        <div className="absolute top-2 right-[5%] text-xs text-red-400 border-b border-red-200 pb-1 text-center whitespace-nowrap overflow-hidden pointer-events-none" style={{width: `${Math.max(0, (1-threshold) * 90)}%`}}>
            Dự đoán: Positive (1)
        </div>

        {/* Area Labels (Moved up slightly to avoid axis) */}
        <div className="absolute bottom-8 left-2 text-xs font-bold text-emerald-600 pointer-events-none bg-white/60 px-1 rounded">Actual Negative</div>
        <div className="absolute bottom-8 right-2 text-xs font-bold text-red-600 pointer-events-none bg-white/60 px-1 rounded">Actual Positive</div>

        {/* X-Axis Labels (Bottom overlay) */}
        <div className="absolute bottom-0 w-full h-6 border-t border-gray-200 bg-white/80 flex items-center justify-between px-0 text-[10px] text-gray-500 font-mono pointer-events-none z-10">
             <div className="w-0 relative flex justify-center"><span className="absolute left-1">0.0</span></div>
             <div className="w-0 relative flex justify-center"><span className="absolute">0.25</span></div>
             <div className="w-0 relative flex justify-center font-bold text-gray-800"><span className="absolute">0.50</span></div>
             <div className="w-0 relative flex justify-center"><span className="absolute">0.75</span></div>
             <div className="w-0 relative flex justify-center"><span className="absolute right-1">1.0</span></div>
        </div>

        {/* Center Axis Title */}
        <div className="absolute bottom-1 w-full text-center pointer-events-none z-20">
             <span className="text-[9px] text-gray-400 uppercase tracking-widest bg-white/80 px-2">Probability Score</span>
        </div>

      </div>
      
      {/* Legend for the areas */}
      <div className="flex gap-3 mt-1 justify-center">
          <div className={`flex items-center gap-1 text-[10px] ${hoveredRegion === 'tn' ? 'font-bold text-emerald-700' : 'text-gray-500'}`}>
             <div className="w-3 h-3 bg-emerald-100 border border-emerald-500 rounded-sm"></div> TN
          </div>
          <div className={`flex items-center gap-1 text-[10px] ${hoveredRegion === 'fp' ? 'font-bold text-orange-700' : 'text-gray-500'}`}>
             <div className="w-3 h-3 bg-orange-100 border border-orange-500 rounded-sm"></div> FP
          </div>
          <div className={`flex items-center gap-1 text-[10px] ${hoveredRegion === 'fn' ? 'font-bold text-slate-700' : 'text-gray-500'}`}>
             <div className="w-3 h-3 bg-slate-300 border border-slate-500 rounded-sm"></div> FN
          </div>
          <div className={`flex items-center gap-1 text-[10px] ${hoveredRegion === 'tp' ? 'font-bold text-red-700' : 'text-gray-500'}`}>
             <div className="w-3 h-3 bg-red-100 border border-red-500 rounded-sm"></div> TP
          </div>
      </div>
    </div>
  );
};

export default DistributionVis;