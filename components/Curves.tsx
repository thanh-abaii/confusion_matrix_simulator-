import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { CurvePoint, MatrixValues } from '../types';

interface Props {
  points: CurvePoint[];
  currentThreshold: number;
}

// Calculate Area Under Curve using Trapezoidal rule
const calculateAUC = (pts: {x: number, y: number}[]) => {
    let area = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        const x1 = pts[i].x;
        const x2 = pts[i+1].x;
        const y1 = pts[i].y;
        const y2 = pts[i+1].y;
        area += (x2 - x1) * (y1 + y2) / 2;
    }
    return Math.abs(area);
};

const Curves: React.FC<Props> = ({ points, currentThreshold }) => {
  
  const rocData = useMemo(() => {
    return points.map(p => ({ x: p.fpr, y: p.tpr, threshold: p.threshold })).sort((a,b) => a.x - b.x);
  }, [points]);

  const prData = useMemo(() => {
    // PR Curve: x = Recall (TPR), y = Precision
    // Filter out NaN precisions
    return points
        .filter(p => !isNaN(p.precision))
        .map(p => ({ x: p.tpr, y: p.precision, threshold: p.threshold }))
        .sort((a,b) => a.x - b.x);
  }, [points]);

  const rocAUC = useMemo(() => calculateAUC(rocData), [rocData]);
  const prAUC = useMemo(() => calculateAUC(prData), [prData]);

  // Find point closest to current threshold to highlight
  const currentROC = rocData.reduce((prev, curr) => Math.abs(curr.threshold - currentThreshold) < Math.abs(prev.threshold - currentThreshold) ? curr : prev);
  const currentPR = prData.reduce((prev, curr) => Math.abs(curr.threshold - currentThreshold) < Math.abs(prev.threshold - currentThreshold) ? curr : prev);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ROC Curve */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">ROC Curve</h3>
            <span className="text-xs font-mono bg-red-100 text-red-800 px-2 py-1 rounded">AUC = {rocAUC.toFixed(3)}</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rocData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" domain={[0, 1]} label={{ value: 'False Positive Rate (1-Spec)', position: 'insideBottom', offset: -10, fontSize: 12 }} />
              <YAxis dataKey="y" type="number" domain={[0, 1]} label={{ value: 'True Positive Rate (Recall)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => value.toFixed(3)} 
                labelFormatter={() => ''}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                        <div className="bg-white p-2 border shadow text-xs">
                        <p>Threshold: {d.threshold.toFixed(2)}</p>
                        <p>FPR: {d.x.toFixed(3)}</p>
                        <p>TPR: {d.y.toFixed(3)}</p>
                        </div>
                    );
                    }
                    return null;
                }}
              />
              {/* Diagonal chance line */}
              <Line type="monotone" dataKey="x" stroke="#cbd5e1" strokeDasharray="5 5" dot={false} activeDot={false} />
              <Area type="monotone" dataKey="y" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
              {/* Current Point Indicator */}
              <ReferenceLine x={currentROC?.x} stroke="black" strokeDasharray="3 3" />
              <ReferenceLine y={currentROC?.y} stroke="black" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
            Đường cong ROC thể hiện khả năng phân loại ở các ngưỡng khác nhau. Càng lồi về góc trái trên càng tốt.
        </div>
      </div>

      {/* Precision-Recall Curve */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">Precision-Recall Curve</h3>
            <span className="text-xs font-mono bg-red-100 text-red-800 px-2 py-1 rounded">PR-AUC = {prAUC.toFixed(3)}</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={prData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" domain={[0, 1]} label={{ value: 'Recall', position: 'insideBottom', offset: -10, fontSize: 12 }} />
              <YAxis dataKey="y" type="number" domain={[0, 1]} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => value.toFixed(3)}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                        <div className="bg-white p-2 border shadow text-xs">
                        <p>Threshold: {d.threshold.toFixed(2)}</p>
                        <p>Recall: {d.x.toFixed(3)}</p>
                        <p>Precision: {d.y.toFixed(3)}</p>
                        </div>
                    );
                    }
                    return null;
                }}
              />
              <Area type="monotone" dataKey="y" stroke="#b91c1c" fill="#fca5a5" strokeWidth={2} />
               {/* Current Point Indicator */}
               <ReferenceLine x={currentPR?.x} stroke="black" strokeDasharray="3 3" />
               <ReferenceLine y={currentPR?.y} stroke="black" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
            Quan trọng khi dữ liệu mất cân bằng (imbalanced data). Ưu tiên độ chính xác của lớp dương tính.
        </div>
      </div>
    </div>
  );
};

export default Curves;